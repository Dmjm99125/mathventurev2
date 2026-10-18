use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Mutex;

use base64::Engine;
use rusqlite::types::Value as SqlValue;
use rusqlite::{params_from_iter, Connection};
use serde_json::{Map, Value};
use tauri::State;

pub struct SqliteState {
    pub db_path: PathBuf,
    pub transactions: Mutex<HashMap<String, Connection>>,
}

impl SqliteState {
    pub fn new(db_path: PathBuf) -> Self {
        Self {
            db_path,
            transactions: Mutex::new(HashMap::new()),
        }
    }
}

fn transaction_error(message: impl Into<String>) -> String {
    format!("SQLite transaction error: {}", message.into())
}

fn sqlite_error(context: &str, error: impl std::fmt::Display) -> String {
    format!("SQLite {context} failed: {error}")
}

fn json_to_sqlite(value: &Value) -> Result<SqlValue, String> {
    match value {
        Value::Null => Ok(SqlValue::Null),
        Value::Bool(value) => Ok(SqlValue::Integer(i64::from(*value))),
        Value::Number(value) => value
            .as_i64()
            .map(SqlValue::Integer)
            .or_else(|| value.as_f64().map(SqlValue::Real))
            .ok_or_else(|| "SQLite parameters must contain finite numbers.".to_owned()),
        Value::String(value) => Ok(SqlValue::Text(value.clone())),
        Value::Array(_) => Err("SQLite parameters cannot contain arrays.".to_owned()),
        Value::Object(value) => {
            let type_name = value.get("__mathventure_type").and_then(Value::as_str);
            if type_name != Some("bytes") {
                return Err("SQLite object parameters must use the bytes encoding.".to_owned());
            }
            let encoded = value
                .get("base64")
                .and_then(Value::as_str)
                .ok_or_else(|| "SQLite byte parameters require base64 data.".to_owned())?;
            let bytes = base64::engine::general_purpose::STANDARD
                .decode(encoded)
                .map_err(|_| "SQLite byte parameters contain invalid base64 data.".to_owned())?;
            Ok(SqlValue::Blob(bytes))
        }
    }
}

fn json_params(params: &[Value]) -> Result<Vec<SqlValue>, String> {
    params.iter().map(json_to_sqlite).collect()
}

fn sqlite_to_json(value: SqlValue) -> Value {
    match value {
        SqlValue::Null => Value::Null,
        SqlValue::Integer(value) => Value::Number(value.into()),
        SqlValue::Real(value) => serde_json::Number::from_f64(value)
            .map(Value::Number)
            .unwrap_or(Value::Null),
        SqlValue::Text(value) => Value::String(value),
        SqlValue::Blob(value) => serde_json::json!({
            "__mathventure_type": "bytes",
            "base64": base64::engine::general_purpose::STANDARD.encode(value),
        }),
    }
}

fn transaction_connection<'a>(
    state: &'a SqliteState,
    transaction_id: &str,
) -> Result<std::sync::MutexGuard<'a, HashMap<String, Connection>>, String> {
    let transactions = state
        .transactions
        .lock()
        .map_err(|_| transaction_error("transaction state is unavailable"))?;
    if !transactions.contains_key(transaction_id) {
        return Err(transaction_error(format!(
            "unknown transaction id {transaction_id}"
        )));
    }
    Ok(transactions)
}

pub fn begin_transaction_inner(state: &SqliteState, transaction_id: String) -> Result<(), String> {
    let mut transactions = state
        .transactions
        .lock()
        .map_err(|_| transaction_error("transaction state is unavailable"))?;
    if transactions.contains_key(&transaction_id) {
        return Err(transaction_error("transaction id is already active"));
    }

    let connection =
        Connection::open(&state.db_path).map_err(|error| sqlite_error("open", error))?;
    connection
        .pragma_update(None, "foreign_keys", "ON")
        .map_err(|error| sqlite_error("configure", error))?;
    connection
        .execute_batch("BEGIN IMMEDIATE")
        .map_err(|error| sqlite_error("begin transaction", error))?;
    transactions.insert(transaction_id, connection);
    Ok(())
}

pub fn query_transaction_inner(
    state: &SqliteState,
    transaction_id: String,
    sql: String,
    params: Vec<Value>,
) -> Result<Vec<Map<String, Value>>, String> {
    let mut transactions = transaction_connection(state, &transaction_id)?;
    let connection = transactions
        .get_mut(&transaction_id)
        .ok_or_else(|| transaction_error("unknown transaction id"))?;
    let values = json_params(&params)?;
    let mut statement = connection
        .prepare(&sql)
        .map_err(|error| sqlite_error("prepare query", error))?;
    let columns = statement
        .column_names()
        .iter()
        .map(|name| (*name).to_owned())
        .collect::<Vec<_>>();
    let rows = statement
        .query_map(params_from_iter(values.iter()), |row| {
            let mut result = Map::new();
            for (index, column) in columns.iter().enumerate() {
                let value = row.get::<usize, SqlValue>(index)?;
                result.insert(column.clone(), sqlite_to_json(value));
            }
            Ok(result)
        })
        .map_err(|error| sqlite_error("query", error))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| sqlite_error("read query rows", error))?;
    Ok(rows)
}

pub fn execute_transaction_inner(
    state: &SqliteState,
    transaction_id: String,
    sql: String,
    params: Vec<Value>,
) -> Result<(), String> {
    let mut transactions = transaction_connection(state, &transaction_id)?;
    let connection = transactions
        .get_mut(&transaction_id)
        .ok_or_else(|| transaction_error("unknown transaction id"))?;
    let values = json_params(&params)?;
    connection
        .execute(&sql, params_from_iter(values.iter()))
        .map_err(|error| sqlite_error("execute", error))?;
    Ok(())
}

pub fn commit_transaction_inner(state: &SqliteState, transaction_id: String) -> Result<(), String> {
    let mut transactions = state
        .transactions
        .lock()
        .map_err(|_| transaction_error("transaction state is unavailable"))?;
    let connection = transactions
        .remove(&transaction_id)
        .ok_or_else(|| transaction_error("unknown transaction id"))?;
    connection
        .execute_batch("COMMIT")
        .map_err(|error| sqlite_error("commit transaction", error))?;
    Ok(())
}

pub fn rollback_transaction_inner(
    state: &SqliteState,
    transaction_id: String,
) -> Result<(), String> {
    let mut transactions = state
        .transactions
        .lock()
        .map_err(|_| transaction_error("transaction state is unavailable"))?;
    let connection = transactions
        .remove(&transaction_id)
        .ok_or_else(|| transaction_error("unknown transaction id"))?;
    connection
        .execute_batch("ROLLBACK")
        .map_err(|error| sqlite_error("rollback transaction", error))?;
    Ok(())
}

#[tauri::command]
pub fn sqlite_begin_transaction(
    state: State<'_, SqliteState>,
    transaction_id: String,
) -> Result<(), String> {
    begin_transaction_inner(&state, transaction_id)
}

#[tauri::command]
pub fn sqlite_query_transaction(
    state: State<'_, SqliteState>,
    transaction_id: String,
    sql: String,
    params: Vec<Value>,
) -> Result<Vec<Map<String, Value>>, String> {
    query_transaction_inner(&state, transaction_id, sql, params)
}

#[tauri::command]
pub fn sqlite_execute_transaction(
    state: State<'_, SqliteState>,
    transaction_id: String,
    sql: String,
    params: Vec<Value>,
) -> Result<(), String> {
    execute_transaction_inner(&state, transaction_id, sql, params)
}

#[tauri::command]
pub fn sqlite_commit_transaction(
    state: State<'_, SqliteState>,
    transaction_id: String,
) -> Result<(), String> {
    commit_transaction_inner(&state, transaction_id)
}

#[tauri::command]
pub fn sqlite_rollback_transaction(
    state: State<'_, SqliteState>,
    transaction_id: String,
) -> Result<(), String> {
    rollback_transaction_inner(&state, transaction_id)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::Path;
    use std::sync::atomic::{AtomicUsize, Ordering};

    static NEXT_DATABASE: AtomicUsize = AtomicUsize::new(0);

    fn test_database_path(label: &str) -> PathBuf {
        let sequence = NEXT_DATABASE.fetch_add(1, Ordering::Relaxed);
        std::env::temp_dir().join(format!(
            "mathventure-{label}-{}-{sequence}.sqlite3",
            std::process::id()
        ))
    }

    fn cleanup(path: &Path) {
        let _ = std::fs::remove_file(path);
    }

    #[test]
    fn failed_transaction_rolls_back_entity_and_outbox_writes() {
        let path = test_database_path("rollback");
        let state = SqliteState::new(path.clone());
        begin_transaction_inner(&state, "tx-1".into()).unwrap();
        execute_transaction_inner(
            &state,
            "tx-1".into(),
            "create table values_table(id text primary key)".into(),
            vec![],
        )
        .unwrap();
        rollback_transaction_inner(&state, "tx-1".into()).unwrap();
        let connection = Connection::open(&path).unwrap();
        assert!(connection.prepare("select * from values_table").is_err());
        cleanup(&path);
    }

    #[test]
    fn committed_transaction_persists_rows() {
        let path = test_database_path("commit");
        let state = SqliteState::new(path.clone());
        begin_transaction_inner(&state, "tx-2".into()).unwrap();
        execute_transaction_inner(
            &state,
            "tx-2".into(),
            "create table values_table(id text primary key)".into(),
            vec![],
        )
        .unwrap();
        execute_transaction_inner(
            &state,
            "tx-2".into(),
            "insert into values_table(id) values (?)".into(),
            vec![Value::String("one".into())],
        )
        .unwrap();
        commit_transaction_inner(&state, "tx-2".into()).unwrap();
        let connection = Connection::open(&path).unwrap();
        let value: String = connection
            .query_row("select id from values_table", [], |row| row.get(0))
            .unwrap();
        assert_eq!(value, "one");
        cleanup(&path);
    }

    #[test]
    fn missing_transaction_ids_are_rejected() {
        let path = test_database_path("missing");
        let state = SqliteState::new(path.clone());
        let error = execute_transaction_inner(&state, "missing".into(), "select 1".into(), vec![])
            .unwrap_err();
        assert!(error.contains("unknown transaction id"));
        cleanup(&path);
    }

    #[test]
    fn json_parameters_and_rows_preserve_scalar_and_blob_values() {
        let path = test_database_path("values");
        let state = SqliteState::new(path.clone());
        begin_transaction_inner(&state, "tx-3".into()).unwrap();
        let rows = query_transaction_inner(
            &state,
            "tx-3".into(),
            "select ? as null_value, ? as text_value, ? as number_value, ? as blob_value".into(),
            vec![
                Value::Null,
                Value::String("text".into()),
                Value::Number(serde_json::Number::from(7)),
                serde_json::json!({ "__mathventure_type": "bytes", "base64": "aGk=" }),
            ],
        )
        .unwrap();
        assert_eq!(rows[0].get("null_value"), Some(&Value::Null));
        assert_eq!(
            rows[0].get("text_value"),
            Some(&Value::String("text".into()))
        );
        assert_eq!(rows[0].get("number_value"), Some(&Value::Number(7.into())));
        assert_eq!(
            rows[0].get("blob_value"),
            Some(&serde_json::json!({ "__mathventure_type": "bytes", "base64": "aGk=" }))
        );
        rollback_transaction_inner(&state, "tx-3".into()).unwrap();
        cleanup(&path);
    }
}
