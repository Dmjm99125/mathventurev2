< !DOCTYPE html >
    <html lang="en">
        <head>
            <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Feed the Hippo! Subtraction Game</title>
                    <style>
                        :root {
                            --purple: #9b5de5;
                        --pink: #f15bb5;
                        --yellow: #fee440;
                        --blue: #00bbf9;
                        --dark: #2b2d42;
        }

                        body {
                            margin: 0;
                        padding: 20px;
                        font-family: 'Comic Sans MS', 'Chalkboard SE', sans-serif;
                        background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
                        color: var(--dark);
                        display: flex;
                        flex-direction: column;
                        justify-content: flex-start; /* Safely starts content at the top on small screens */
                        align-items: center;
                        min-height: 100vh;
                        min-height: 100dvh; /* Accounts for mobile browser address bars */
                        gap: 25px;
                        box-sizing: border-box;
                        user-select: none;
                        -webkit-user-select: none;
        }

                        #game-board {
                            width: 100%;
                        max-width: 480px;
                        margin-top: auto; /* Pushes the box down to center when there is space */
                        background: white;
                        border-radius: 30px;
                        padding: 25px;
                        box-shadow: 0 12px 30px rgba(0,0,0,0.15);
                        text-align: center;
                        position: relative;
                        overflow: hidden;
                        box-sizing: border-box;
        }

                        /* Top Bar */
                        .header-stats {
                            display: flex;
                        justify-content: space-between;
                        font-size: 1.3rem;
                        font-weight: bold;
                        color: var(--purple);
                        margin-bottom: 10px;
        }

                        /* Animated Character Area */
                        #character-box {
                            font - size: 5rem;
                        margin: 10px 0;
                        animation: bounce 2s infinite ease-in-out;
                        height: 100px;
                        display: flex;
                        justify-content: center;
                        align-items: center;
        }

                        @keyframes bounce {
                            0 %, 100 % { transform: translateY(0); }
            50% {transform: translateY(-10px); }
        }

                        #math-box {
                            font - size: 3.2rem;
                        font-weight: 900;
                        color: var(--dark);
                        margin: 15px 0;
                        background: #f8fafc;
                        border-radius: 20px;
                        padding: 10px;
                        box-shadow: inset 0 4px 6px rgba(0,0,0,0.05);
        }

                        /* Grid for answers */
                        #answers-grid {
                            display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 15px;
                        margin-top: 20px;
        }

                        .ans-btn {
                            background - color: var(--blue);
                        color: white;
                        border: none;
                        border-radius: 20px;
                        font-size: 2.5rem;
                        font-weight: bold;
                        padding: 20px 0;
                        cursor: pointer;
                        box-shadow: 0 8px 0 #0096cb;
                        transition: all 0.1s ease;
                        font-family: inherit;
        }

                        .ans-btn:active {
                            box - shadow: 0 2px 0 #0096cb;
                        transform: translateY(6px);
        }

                        /* Reward Modal Overlay */
                        #reward-overlay {
                            position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(255, 255, 255, 0.95);
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        z-index: 10;
                        transform: scale(0);
                        transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                        border-radius: 30px;
        }

                        #reward-overlay.show {
                            transform: scale(1);
        }

                        .sticker {
                            font - size: 7rem;
                        margin: 20px;
                        animation: spin 1s ease-out;
        }

                        @keyframes spin {
                            0 % { transform: scale(0) rotate(0deg); }
            100% {transform: scale(1) rotate(360deg); }
        }

                        .claim-btn {
                            background - color: var(--pink);
                        color: white;
                        border: none;
                        padding: 12px 30px;
                        font-size: 1.5rem;
                        border-radius: 50px;
                        cursor: pointer;
                        box-shadow: 0 5px 0 #d946ef;
                        font-family: inherit;
                        font-weight: bold;
        }

                        /* Sticker Book collection display */
                        #sticker-book {
                            margin - top: 20px;
                        padding-top: 15px;
                        border-top: 2px dashed #cbd5e1;
                        min-height: 40px;
        }

                        .sticker-title {
                            font - size: 0.9rem;
                        color: #94a3b8;
                        margin-bottom: 5px;
                        text-transform: uppercase;
                        letter-spacing: 1px;
        }

                        #sticker-container {
                            display: flex;
                        justify-content: center;
                        gap: 8px;
                        flex-wrap: wrap;
                        font-size: 1.5rem;
        }

                        /* Modern layout for bottom navigation images */
                        .nav-buttons {
                            display: flex;
                        flex-direction: row;
                        justify-content: center;
                        align-items: center;
                        flex-wrap: wrap;
                        gap: 20px;
                        margin-bottom: auto; /* Pushes the buttons up to balance the centering */
        }

                        .nav-buttons img {
                            transition: transform 0.2s;
                        border-radius: 15px;
        }

                        @media (hover: hover) {
            .nav - buttons img:hover {
                            transform: scale(1.05);
            }
        }
                    </style>
                </head>
                <body>

                    <div id="game-board">
                        <div id="reward-overlay">
                            <h2 style="color: var(--pink); margin: 0; font-size: 2rem;">🌟 10 Points Reward! 🌟</h2>
                            <p style="font-size: 1.2rem; margin: 5px 0;">You earned a new sticker for your book!</p>
                            <div class="sticker" id="prize-sticker">🍩</div>
                            <button class="claim-btn" onclick="closeReward()">Yay! Keep Playing</button>
                        </div>

                        <div class="header-stats">
                            <div>Score: <span id="score-text" style="color: var(--pink);">0</span></div>
                            <div>Target: <span id="target-text">10</span></div>
                        </div>

                        <div id="character-box" id="hippo">🦛</div>
                        <p style="margin: 0; color: #64748b; font-weight: bold;">Feed the Hippo! Choose the right snack value:</p>

                        <div id="math-box">8 - 3</div>

                        <div id="answers-grid">
                            <button class="ans-btn" onclick="selectAnswer(this)">?</button>
                            <button class="ans-btn" onclick="selectAnswer(this)">?</button>
                            <button class="ans-btn" onclick="selectAnswer(this)">?</button>
                            <button class="ans-btn" onclick="selectAnswer(this)">?</button>
                        </div>

                        <div id="sticker-book">
                            <div class="sticker-title">Your Sticker Book</div>
                            <div id="sticker-container"></div>
                        </div>
                    </div>

                    <div class="nav-buttons">
                        <a href='/space'><img src="np.png" width="80" height="50" alt="Next Page"></a>
                        <a href='/1'><img src="ACT.png" width="80" height="50" alt="Activity"></a>
                    </div>

                    <script>
                        let score = 0;
                        let correctAnswer = 0;
                        let nextRewardMilestone = 10;

                        const rewards = ['🍩', '🍦', '🍕', '🍟', '🎨', '🚀', '🦖', '🦄', '🏆', '🐼', '🦁', '👑'];
                        const foodEmojis = ['🍏', '🍌', '🍉', '🍓', '🥕', '🍪'];

                        function playSound(type) {
            if ('speechSynthesis' in window) {
                            window.speechSynthesis.cancel();

                        let utterance = new SpeechSynthesisUtterance();
                        if (type === 'correct') {
                            utterance.text = "Yum!";
                        utterance.pitch = 1.6;
                        utterance.rate = 1.4;
                } else if (type === 'wrong') {
                            utterance.text = "Uh oh!";
                        utterance.pitch = 1;
                        utterance.rate = 1.3;
                } else if (type === 'reward') {
                            utterance.text = "Wow! Magnificent! You got a prize!";
                        utterance.pitch = 1.4;
                        utterance.rate = 1.1;
                }
                        window.speechSynthesis.speak(utterance);
            }
        }

                        function buildQuestion() {
            const hippo = document.getElementById('character-box');
                        hippo.textContent = '🦛';

                        const num1 = Math.floor(Math.random() * 6) + 3;
                        const num2 = Math.floor(Math.random() * (num1 + 1));
                        correctAnswer = num1 - num2;

                        document.getElementById('math-box').textContent = `${num1} - ${num2}`;

                        let choices = [correctAnswer];
                        while (choices.length < 4) {
                            let fake = Math.floor(Math.random() * 9);
                        if (!choices.includes(fake)) {
                            choices.push(fake);
                }
            }
            choices.sort(() => Math.random() - 0.5);

                        const buttons = document.querySelectorAll('.ans-btn');
            buttons.forEach((btn, idx) => {
                            btn.textContent = choices[idx];
                        btn.disabled = false;
                        btn.style.backgroundColor = 'var(--blue)';
                        btn.style.boxShadow = '0 8px 0 #0096cb';
            });
        }

                        function selectAnswer(button) {
            const chosen = parseInt(button.textContent);
                        const buttons = document.querySelectorAll('.ans-btn');

                        if (chosen === correctAnswer) {
                            score++;
                        document.getElementById('score-text').textContent = score;

                        playSound('correct');
                        document.getElementById('character-box').textContent = '😋'; 

                buttons.forEach(btn => btn.disabled = true);

                        if (score === nextRewardMilestone) {
                            setTimeout(triggerRewardScreen, 1000);
                } else {
                            setTimeout(buildQuestion, 1200);
                }
            } else {
                            playSound('wrong');
                        button.style.backgroundColor = '#ef4444';
                        button.style.boxShadow = '0 8px 0 #b91c1c';
                        button.disabled = true; 
            }
        }

                        function triggerRewardScreen() {
                            playSound('reward');

                        const randomSticker = rewards[Math.floor(Math.random() * rewards.length)];
                        document.getElementById('prize-sticker').textContent = randomSticker;

                        const container = document.getElementById('sticker-container');
                        const span = document.createElement('span');
                        span.textContent = randomSticker;
                        container.appendChild(span);

                        document.getElementById('reward-overlay').classList.add('show');

                        nextRewardMilestone += 10;
        }

                        function closeReward() {
                            document.getElementById('reward-overlay').classList.remove('show');
                        document.getElementById('target-text').textContent = nextRewardMilestone;
                        buildQuestion();
        }

                        buildQuestion();
                    </script>
                </body>
            </html>