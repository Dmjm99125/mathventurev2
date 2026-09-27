import { assertEquals } from "jsr:@std/assert";
import {
  createPwaInstallClient,
  type InstallPromptEvent,
} from "../../../src/lib/pwa/install.ts";

class FakeTarget extends EventTarget {
  displayModeStandalone = false;
  navigator = { standalone: false };

  matchMedia() {
    return { matches: this.displayModeStandalone };
  }
}

function promptEvent(outcome: "accepted" | "dismissed") {
  let promptCalls = 0;
  const event = new Event("beforeinstallprompt") as InstallPromptEvent;
  event.preventDefault = () => undefined;
  event.prompt = async () => {
    promptCalls += 1;
  };
  event.userChoice = Promise.resolve({ outcome, platform: "web" });
  return { event, getPromptCalls: () => promptCalls };
}

Deno.test("captures the browser prompt and resolves an accepted install", async () => {
  const target = new FakeTarget();
  const client = createPwaInstallClient(target);
  const prompt = promptEvent("accepted");

  target.dispatchEvent(prompt.event);
  assertEquals(client.getState().canInstall, true);
  assertEquals(await client.install(), "accepted");
  assertEquals(prompt.getPromptCalls(), 1);
  assertEquals(client.getState().canInstall, false);
  client.dispose();
});

Deno.test("dismissed prompts do not mark the app installed", async () => {
  const target = new FakeTarget();
  const client = createPwaInstallClient(target);
  const prompt = promptEvent("dismissed");

  target.dispatchEvent(prompt.event);
  assertEquals(await client.install(), "dismissed");
  assertEquals(client.getState().isInstalled, false);
  assertEquals(client.getState().canInstall, false);
  client.dispose();
});

Deno.test("recognizes standalone installations and appinstalled events", () => {
  const target = new FakeTarget();
  target.displayModeStandalone = true;
  const client = createPwaInstallClient(target);

  assertEquals(client.getState().isInstalled, true);
  target.dispatchEvent(new Event("appinstalled"));
  assertEquals(client.getState().isInstalled, true);
  assertEquals(client.getState().canInstall, false);
  client.dispose();
});

Deno.test("returns unavailable when the browser has no install prompt", async () => {
  const client = createPwaInstallClient(new FakeTarget());

  assertEquals(await client.install(), "unavailable");
  client.dispose();
});
