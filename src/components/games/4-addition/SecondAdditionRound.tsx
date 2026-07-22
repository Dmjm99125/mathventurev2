<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Fun Kindergarten Addition Game!</title>
    <style>
        :root {
            --primary-color: #ff6b6b;
            --secondary-color: #4ecdc4;
            --accent-color: #ffe66d;
            --text-color: #2f3e46;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            user-select: none;
            -webkit-user-select: none;
        }

        body {
            font-family: 'Comic Sans MS', 'Chalkboard SE', 'Arial', sans-serif;
            background: linear-gradient(180deg, #e0f2fe 0%, #bae6fd 100%);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: var(--text-color);
            overflow-x: hidden;
            padding: 15px;
        }

        #game-container {
            background: white;
            border-radius: 24px;
            padding: 20px;
            width: 100%;
            max-width: 500px;
            text-align: center;
            box-shadow: 0 12px 24px rgba(0,0,0,0.15);
            border: 6px solid #4ecdc4;
            position: relative;
        }

        /* Progress Bar and Score */
        .header-status {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            font-size: 1.2rem;
            font-weight: bold;
        }

        .score-box {
            background: var(--accent-color);
            padding: 5px 15px;
            border-radius: 15px;
            border: 2px solid #fbcfe8;
        }

        /* Equation Visual Area */
        .math-box {
            background: #f0fdf4;
            border-radius: 20px;
            padding: 20px;
            margin-bottom: 25px;
            border: 3px dashed #86efac;
        }

        .equation {
            font-size: 3.5rem;
            font-weight: bold;
            color: #1e3a8a;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;
        }

        /* Visual Counter Objects (Circles) */
        .visual-counters {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 15px;
            min-height: 50px;
            flex-wrap: wrap;
        }

        .counter-group {
            display: flex;
            gap: 5px;
        }

        .dot {
            width: 24px;
            height: 24px;
            background-color: #ff6b6b;
            border-radius: 50%;
            display: inline-block;
            box-shadow: inset -3px -3px 0px rgba(0,0,0,0.15);
            animation: bounce 0.6s ease infinite alternate;
        }

        .dot.blue {
            background-color: #3b82f6;
        }

        .plus-sign {
            font-size: 1.5rem;
            font-weight: bold;
            color: #94a3b8;
        }

        /* Answer Buttons (Balloon Style) */
        .options-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-bottom: 10px;
        }

        .btn-choice {
            background: #ff8787;
            color: white;
            font-size: 2.2rem;
            font-weight: bold;
            border: none;
            padding: 15px;
            border-radius: 50px;
            cursor: pointer;
            box-shadow: 0 8px 0 #fa5252;
            transition: all 0.1s ease;
            display: flex;
            justify-content: center;
            align-items: center;
            position: relative;
            min-height: 80px;
        }

        .btn-choice:active {
            transform: translateY(4px);
            box-shadow: 0 4px 0 #fa5252;
        }

        /* Colors for Balloon variety */
        .btn-choice:nth-child(1) { background: #ff6b6b; box-shadow: 0 8px 0 #e03131; }
        .btn-choice:nth-child(2) { background: #4ecdc4; box-shadow: 0 8px 0 #0ca678; }
        .btn-choice:nth-child(3) { background: #45b7d1; box-shadow: 0 8px 0 #1971c2; }
        .btn-choice:nth-child(4) { background: #f783ac; box-shadow: 0 8px 0 #d01716; }

        .btn-choice:nth-child(1):active { box-shadow: 0 4px 0 #e03131; }
        .btn-choice:nth-child(2):active { box-shadow: 0 4px 0 #0ca678; }
        .btn-choice:nth-child(3):active { box-shadow: 0 4px 0 #1971c2; }
        .btn-choice:nth-child(4):active { box-shadow: 0 4px 0 #d01716; }

        /* Reward Overlay Screen */
        .overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 18px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 10;
            display: none;
        }

        .overlay h2 {
            font-size: 2.5rem;
            color: #22c55e;
            margin-bottom: 10px;
            animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .reward-star {
            font-size: 5rem;
            animation: spin 1s ease;
        }

        /* Animations */
        @keyframes bounce {
            from { transform: translateY(0); }
            to { transform: translateY(-6px); }
        }

        @keyframes popIn {
            0% { transform: scale(0.5); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
        }

        @keyframes spin {
            0% { transform: scale(0) rotate(0deg); }
            100% { transform: scale(1) rotate(360deg); }
        }

        /* Confetti Effect elements */
        .confetti {
            position: absolute;
            width: 10px;
            height: 10px;
            background-color: #ffd43b;
            animation: fall 1.5s linear infinite;
        }

        @keyframes fall {
            0% { transform: translateY(-50px) rotate(0deg); opacity: 1; }
            100% { transform: translateY(400px) rotate(360deg); opacity: 0; }
        }
    </style>
</head>
<body>

    <div id="game-container">
        <!-- Status Header -->
        <div class="header-status">
            <span>Question: <span id="question-num">1</span>/5</span>
            <div class="score-box">⭐ Stars: <span id="score">0</span></div>
        </div>

        <!-- Math Problem Display -->
        <div class="math-box">
            <div class="equation">
                <span id="num1">2</span>
                <span>+</span>
                <span id="num2">3</span>
                <span>=</span>
                <span>?</span>
            </div>
            
            <!-- Visual aids for Kindergarteners -->
            <div class="visual-counters" id="visual-counters">
                <!-- Injected via JavaScript -->
            </div>
        </div>

        <!-- Choices Layout -->
        <div class="options-grid" id="options-container">
            <!-- Injected via JavaScript -->
        </div>

        <!-- Feedback & Reward Screen Overlay -->
        <div class="overlay" id="feedback-overlay">
            <div class="reward-star" id="feedback-icon">🎈</div>
            <h2 id="feedback-text">Correct!</h2>
        </div>
    </div>

    <!-- Sound effects utilizing Web Audio API so no external asset loading is required -->
    <script>
        // Web Audio API Sound Generator
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        function playSound(type) {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            if (type === 'correct') {
                // Happy pop followed by higher tone
                osc.type = 'sine';
                osc.frequency.setValueAtTime(400, audioCtx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.3);
                gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.3);
            } else if (type === 'wrong') {
                // Low buzz sound
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(150, audioCtx.currentTime);
                osc.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + 0.4);
                gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.4);
            } else if (type === 'win') {
                // Triumph fanfare
                const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
                notes.forEach((freq, index) => {
                    const o = audioCtx.createOscillator();
                    const g = audioCtx.createGain();
                    o.connect(g);
                    g.connect(audioCtx.destination);
                    o.frequency.setValueAtTime(freq, audioCtx.currentTime + (index * 0.1));
                    g.gain.setValueAtTime(0.2, audioCtx.currentTime + (index * 0.1));
                    g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + (index * 0.1) + 0.4);
                    o.start(audioCtx.currentTime + (index * 0.1));
                    o.stop(audioCtx.currentTime + (index * 0.1) + 0.4);
                });
            }
        }

        // Game Configuration and State
        let currentQuestion = 1;
        const totalQuestions = 5;
        let score = 0;
        let correctAnswer = 0;

        const num1El = document.getElementById('num1');
        const num2El = document.getElementById('num2');
        const countersEl = document.getElementById('visual-counters');
        const optionsContainer = document.getElementById('options-container');
        const overlay = document.getElementById('feedback-overlay');
        const feedbackText = document.getElementById('feedback-text');
        const feedbackIcon = document.getElementById('feedback-icon');
        const scoreEl = document.getElementById('score');
        const questionNumEl = document.getElementById('question-num');

        // Generate a random math problem
        function generateProblem() {
            // Keep numbers simple for kindergarten level (Sums under 10)
            const n1 = Math.floor(Math.random() * 5) + 1; // 1 to 5
            const n2 = Math.floor(Math.random() * 4) + 1; // 1 to 4
            correctAnswer = n1 + n2;

            num1El.textContent = n1;
            num2El.textContent = n2;

            // Generate concrete counting dots to help children count
            countersEl.innerHTML = '';
            
            const group1 = document.createElement('div');
            group1.className = 'counter-group';
            for(let i=0; i<n1; i++) {
                const dot = document.createElement('span');
                dot.className = 'dot';
                group1.appendChild(dot);
            }
            
            const plus = document.createElement('span');
            plus.className = 'plus-sign';
            plus.textContent = 'and';
            
            const group2 = document.createElement('div');
            group2.className = 'counter-group';
            for(let i=0; i<n2; i++) {
                const dot = document.createElement('span');
                dot.className = 'dot blue';
                group2.appendChild(dot);
            }

            countersEl.appendChild(group1);
            countersEl.appendChild(plus);
            countersEl.appendChild(group2);

            // Generate multiple choice answers
            generateChoices(correctAnswer);
        }

        function generateChoices(correct) {
            optionsContainer.innerHTML = '';
            let choices = [correct];
            
            // Build unique wrong choices near the right answer
            while(choices.length < 4) {
                let wrong = correct + (Math.floor(Math.random() * 5) - 2);
                if(wrong > 0 && wrong <= 10 && !choices.includes(wrong)) {
                    choices.push(wrong);
                }
            }

            // Shuffle choice array
            choices.sort(() => Math.random() - 0.5);

            // Create buttons
            choices.forEach(choice => {
                const btn = document.createElement('button');
                btn.className = 'btn-choice';
                btn.textContent = choice;
                // Using pointerdown for instant responsive mobile feel
                btn.addEventListener('pointerdown', () => checkAnswer(choice));
                optionsContainer.appendChild(btn);
            });
        }

        function checkAnswer(selected) {
            overlay.style.display = 'flex';
            
            if(selected === correctAnswer) {
                playSound('correct');
                score++;
                scoreEl.textContent = score;
                feedbackIcon.textContent = '⭐';
                feedbackText.textContent = 'Great Job!';
                feedbackText.style.color = '#22c55e';
                createConfetti();
            } else {
                playSound('wrong');
                feedbackIcon.textContent = '❌';
                feedbackText.textContent = `Oops! It was ${correctAnswer}`;
                feedbackText.style.color = '#ef4444';
            }

            // Pause briefly to let student see feedback, then advance
            setTimeout(() => {
                overlay.style.display = 'none';
                if(currentQuestion < totalQuestions) {
                    currentQuestion++;
                    questionNumEl.textContent = currentQuestion;
                    generateProblem();
                } else {
                    showEndGame();
                }
            }, 2000);
        }

        function createConfetti() {
            for(let i=0; i<20; i++) {
                const conf = document.createElement('div');
                conf.className = 'confetti';
                conf.style.left = Math.random() * 100 + '%';
                conf.style.backgroundColor = `hsl(${Math.random() * 360}deg, 100%, 60%)`;
                conf.style.animationDelay = Math.random() * 0.5 + 's';
                overlay.appendChild(conf);
                setTimeout(() => conf.remove(), 1500);
            }
        }

        function showEndGame() {
            overlay.style.display = 'flex';
            playSound('win');
            feedbackIcon.textContent = '🏆';
            feedbackText.innerHTML = `You Finished!<br>Score: ${score}/${totalQuestions}`;
            feedbackText.style.color = '#1e3a8a';
            
            // Add a restart button
            const restartBtn = document.createElement('button');
            restartBtn.textContent = 'Play Again';
            restartBtn.style.cssText = 'margin-top:20px; padding:12px 25px; font-size:1.5rem; background:#4ecdc4; color:white; border:none; border-radius:20px; box-shadow:0 5px 0 #0ca678; cursor:pointer; font-family: inherit;';
            
            restartBtn.addEventListener('pointerdown', () => {
                currentQuestion = 1;
                score = 0;
                scoreEl.textContent = score;
                questionNumEl.textContent = currentQuestion;
                restartBtn.remove();
                overlay.style.display = 'none';
                generateProblem();
            });
            overlay.appendChild(restartBtn);
        }

        // Start the game loop on open
        generateProblem();
    </script>

<br>

<center>
<table>
<tr>
	<td>
	 <center><a href='/4dn1'><img src="np.png" width="150" length="200"></a></center>
	</td>

	<td>
	 <center><a href='/1'><img src="ACT.png" width="150" length="150"></a></center>
	</td>
</tr>
</table>
</center>

</body>
</html>