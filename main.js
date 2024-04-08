const difficulties = {
	"easy": "Fácil",
	"medium": "Médio",
	"hard": "Difícil"
};

let tempToken;
let QUESTIONS = [];
let currentQuestion = 0;
const totalQuestions = 25;

function setupQuestion(index) {
	document.querySelector(".question-container").classList.remove("hidden");

	const question = QUESTIONS[index];
	const questionElement = document.querySelector('#question');
	const answersElement = document.querySelector('#answers');
	
	document.querySelector('#question-category').textContent = question.category;
	document.querySelector('#question-number').textContent = `Pergunta ${index + 1}/${QUESTIONS.length}`;
	document.querySelector('#question-difficulty').textContent = difficulties[question.difficulty];

	questionElement.textContent = question.question;
	
	answersElement.innerHTML = '';
	
	question.answers.forEach((answer, index) => {
		const answerElement = document.createElement('li');
		answerElement.innerHTML = `
			<input type="radio" name="answer" id="answer-${index}" value="${index}">
			<label for="answer-${index}">${answer}</label>
		`;
		
		answersElement.appendChild(answerElement);
	});

	if (question.answer) {
		document.querySelector(`input[value="${question.answer}"]`).checked = true;
	}

	if (index <= 0) {
		document.querySelector('#previous').style.display = 'none';
	} else {
		document.querySelector('#previous').style.display = null;
	}

	if (index >= QUESTIONS.length - 1) {
		document.querySelector('#next').textContent = "Finalizar";
	} else {
		document.querySelector('#next').textContent = "Próxima";
	}
}

function previousQuestion() {
	currentQuestion--;
	setupQuestion(currentQuestion);
}

function nextQuestion() {
	if (document.querySelector('input[name="answer"]:checked') === null) {
		return alert('Selecione uma resposta antes de prosseguir!');
	}

	const question = QUESTIONS[currentQuestion];
	const answer = parseInt(document.querySelector('input[name="answer"]:checked').value);
	question.answer = answer;

	currentQuestion++;
	if (currentQuestion >= QUESTIONS.length) {
		finishQuiz();
		return;
	}

	setupQuestion(currentQuestion);
}

function finishQuiz() {
	document.querySelector(".question-container").classList.add("hidden");

	const correctAnswers = QUESTIONS.filter(question => question.correct === question.answer).length;
	const score = Math.round(correctAnswers / QUESTIONS.length * 100);

	if (score >= 80) {
		let params = {
			particleCount: 500, // Quantidade de confetes
			spread: 90, // O quanto eles se espalham
			startVelocity: 70, // Velocidade inicial
			origin: { x: 0, y: 0.5 }, // Posição inicial na tela
			angle: 45 // Ângulo em que os confetes serão lançados
		};

		// Joga confetes da esquerda pra direita
		confetti(params);

		// Joga confetes da direita para a esquerda
		params.origin.x = 1;
		params.angle = 135;
		confetti(params);
	}

	document.querySelector('#score').classList.remove('hidden');
	document.querySelector('#score p').textContent = `Você acertou ${correctAnswers} de ${QUESTIONS.length} perguntas (${score}%)!`;
}

async function loadQuestions() {
	const category = document.querySelector('#category').value;

	document.querySelector('#score').classList.add('hidden');

	if (!tempToken) {
		try {
			tempToken = (await (await fetch("https://tryvia.ptr.red/api_token.php?command=request")).json()).token;
		} catch (err) {
			return alert("Houve um erro ao carregar as perguntas...");
		}
	}

	fetch(`https://tryvia.ptr.red/api.php?amount=${totalQuestions}&token=${tempToken}&category=${category}`)
		.then((response) => response.json())
		.then((data) => {
			currentQuestion = 0;
			QUESTIONS = [];

			for (const question of data.results) {
				const answers = question.incorrect_answers.concat(question.correct_answer);
				answers.sort(() => Math.random() - 0.5);
				QUESTIONS.push({
					question: question.question,
					answers,
					correct: answers.indexOf(question.correct_answer),
					category: question.category,
					difficulty: question.difficulty,
				});
			}
			setupQuestion(currentQuestion);
		});
}

document.querySelector('#previous').addEventListener('click', previousQuestion);
document.querySelector('#next').addEventListener('click', nextQuestion);
document.querySelector('#restart').addEventListener('click', loadQuestions);
document.addEventListener('DOMContentLoaded', async () => {
	await fetch("https://tryvia.ptr.red/api_category.php")
		.then((response) => response.json())
		.then((data) => {
			const categoryElement = document.querySelector('#category');
			categoryElement.innerHTML = '';

			data.trivia_categories.sort((a, b) => a.name.localeCompare(b.name));
			data.trivia_categories.unshift({ id: 0, name: 'Todas as categorias' });

			for (const category of data.trivia_categories) {
				const option = document.createElement('option');
				option.value = category.id;
				option.textContent = category.name;
				categoryElement.appendChild(option);
			}
		});
	
	loadQuestions();
});

document.querySelector('#category').addEventListener('change', loadQuestions);