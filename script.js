"use strict";

/////////////////////////////////////////////////
/////////////////////////////////////////////////
// BANKIST APP

// Globals
let currentAccount;

// Data
const account1 = {
	owner: "Jonas Schmedtmann",
	movements: [200, 450, -400, 3000, -650, -130, 70, 1300],
	interestRate: 1.2, // %
	pin: 1111,
};

const account2 = {
	owner: "Jessica Davis",
	movements: [5000, 3400, -150, -790, -3210, -1000, 8500, -30],
	interestRate: 1.5,
	pin: 2222,
};

const account3 = {
	owner: "Steven Thomas Williams",
	movements: [200, -200, 340, -300, -20, 50, 400, -460],
	interestRate: 0.7,
	pin: 3333,
};

const account4 = {
	owner: "Sarah Smith",
	movements: [430, 1000, 700, 50, 90],
	interestRate: 1,
	pin: 4444,
};

const account5 = {
	owner: "Darshan Vaishya",
	movements: [200, 500, 10000, -5000, 650, -200],
	interestRate: 1,
	pin: 1111,
};

const accounts = [account1, account2, account3, account4, account5];

// Elements
const labelWelcome = document.querySelector(".welcome");
const labelDate = document.querySelector(".date");
const labelBalance = document.querySelector(".balance__value");
const labelSumIn = document.querySelector(".summary__value--in");
const labelSumOut = document.querySelector(".summary__value--out");
const labelSumInterest = document.querySelector(".summary__value--interest");
const labelTimer = document.querySelector(".timer");

const containerApp = document.querySelector(".app");
const containerMovements = document.querySelector(".movements");
const containerNotificationBox = document.querySelector(".notification-box");
const containerModalWindow = document.querySelector(".modal-window-wrapper");

const modalwindow = document.querySelector(".modal-window");

const btnLogin = document.querySelector(".login__btn");
const btnTransfer = document.querySelector(".form__btn--transfer");
const btnLoan = document.querySelector(".form__btn--loan");
const btnClose = document.querySelector(".form__btn--close");
const btnSort = document.querySelector(".btn--sort");
const btnYes = document.querySelector(".yes");
const btnNo = document.querySelector(".no");

const inputLoginUsername = document.querySelector(".login__input--user");
const inputLoginPin = document.querySelector(".login__input--pin");
const inputTransferTo = document.querySelector(".form__input--to");
const inputTransferAmount = document.querySelector(".form__input--amount");
const inputLoanAmount = document.querySelector(".form__input--loan-amount");
const inputCloseUsername = document.querySelector(".form__input--user");
const inputClosePin = document.querySelector(".form__input--pin");

/**
 * @this {number[]}
 * @returns number
 */
Array.prototype.sum = function () {
	return this.reduce((accu, current) => accu + current);
};

/**
 * Given an array of numbers, it will parse, create an element and insert them into the movements container inside the DOM.
 * @param {number[]} movements
 */
function displayMovements(movements, sort = false) {
	containerMovements.innerHTML = "";
	movements.forEach((movement, index) => {
		const type = movement < 0 ? "withdrawal" : "deposit";
		const element = `<div class="movements__row">
		<div class="movements__type movements__type--${type}">${index + 1} ${type}</div>
		<div class="movements__date">3 days ago</div>
		<div class="movements__value">${movement}€</div>
	</div>`;

		containerMovements.insertAdjacentHTML("afterbegin", element);
	});
}

/**
 * Calculates the sum of all the transactions and displays the sum on current balance element on the DOM.
 * @param {number[]} movements
 */
function calcDisplayBalance(movements) {
	const balance = movements.reduce((sum, current) => sum + current);
	labelBalance.textContent = `${balance}€`;
	currentAccount.balance = balance;
}

/**
 * Given an array of numbers, it will display all the deposits and withdrawals as well as the interest generated in the DOM.
 * @param {number[]} movements
 */
function calcDisplaySummary(movements) {
	// Calculating the deposits
	let result = movements.filter((movement) => movement > 0).sum();
	labelSumIn.textContent = `${result}€`;

	// Calculating the withdrawals
	result = movements.filter((movement) => movement < 0).sum();
	labelSumOut.textContent = `${Math.abs(result)}€`;

	// Calculating the interest
	result = movements
		.filter((movement) => movement > 0)
		.map((mov) => (mov * currentAccount.interestRate) / 100)
		.filter((mov) => mov >= 1)
		.sum()
		.toFixed(2);
	labelSumInterest.textContent = `${result}€`;
}

/**
 * Given an array of objects, it will generate username for it by joining the first letters of each word.
 * @param {{owner: String, movements: number[], interestRate: number, pin: number}[]} accounts
 */
function createUsernames(accounts) {
	accounts.forEach((account) => {
		account.username = account.owner
			.toLowerCase()
			.split(" ")
			.map((word) => word[0])
			.join("");
	});
}
createUsernames(accounts);

/**
 * Updates the UI for the given array of movements.
 * @param {number[]} movements
 */
function updateUI(movements) {
	displayMovements(movements);
	calcDisplayBalance(movements);
	calcDisplaySummary(movements);
}

btnLogin.addEventListener("click", (event) => {
	event.preventDefault();

	currentAccount = accounts.find(
		(acc) => acc.username === inputLoginUsername.value
	);

	if (currentAccount?.pin === +inputLoginPin.value) {
		labelWelcome.textContent = `Welcome back, ${
			currentAccount.owner.split(" ")[0]
		}`;
		containerApp.style.opacity = 1;

		// Clearing inputs
		inputLoginUsername.value = inputLoginPin.value = "";
		inputLoginPin.blur();

		// Populating with data
		updateUI(currentAccount.movements);

		displayNotification("Logged in successfully", "success");
	} else if (inputLoginPin.value === "" || inputLoginUsername.value === "") {
		displayNotification("Please fill all the inputs", "error");
	} else {
		displayNotification("Invalid username or password", "error");
	}
});

btnTransfer.addEventListener("click", (event) => {
	event.preventDefault();
	const amount = +inputTransferAmount.value;
	let receiverAcc = inputTransferTo.value;

	receiverAcc = accounts.find((acc) => acc.username === receiverAcc);

	if (!receiverAcc) displayNotification("User not found!", "warning");
	else if (!amount || amount <= 0)
		displayNotification("Enter a valid amount", "warning");
	else if (currentAccount.username === receiverAcc.username)
		displayNotification("Can't send money to self", "warning");
	else if (currentAccount.balance < amount)
		displayNotification("Not enough balance!", "error");
	else {
		currentAccount.movements.push(-1 * amount);
		receiverAcc.movements.push(amount);

		inputTransferAmount.value = inputTransferTo.value = "";
		inputTransferAmount.blur();
		inputTransferTo.blur();
		displayNotification(
			`Successfully transferred ${amount} to ${receiverAcc.owner}`,
			"success"
		);
	}

	updateUI(currentAccount.movements);
});

btnClose.addEventListener("click", (event) => {
	event.preventDefault();

	if (
		inputCloseUsername.value === currentAccount.username &&
		+inputClosePin.value === currentAccount.pin
	) {
		showModal();
	} else {
		displayNotification("Invalid username or pin entered", "error");
	}
});

btnLoan.addEventListener("click", (e) => {
	e.preventDefault();
	const amount = +inputLoanAmount.value;
	if (
		amount > 0 &&
		currentAccount.movements.some((mov) => mov >= amount * 0.1)
	) {
		currentAccount.movements.push(amount);
		updateUI(currentAccount.movements);
		displayNotification(`Loan granted!`, "success");
	} else if (!amount || amount <= 0) {
		displayNotification("Enter a valid loan amount", "warning");
	} else {
		displayNotification("Not enough balance. Take a smaller loan.", "error");
	}
});

// Notification functions
function removeNotification() {
	this.classList.add("hidden");
	this.addEventListener("transitionend", this.remove);
}

function displayNotification(text, className = "") {
	let notification = `
	<div class="notification hidden ${className}">
		${text}
		<button class="hide-notification">x</button>
	</div>`;
	containerNotificationBox.insertAdjacentHTML("afterbegin", notification);

	notification = document.querySelector(".notification");
	notification.addEventListener("click", removeNotification);

	setTimeout(removeNotification.bind(notification), 5000);
	setTimeout(() => notification.classList.remove("hidden"), 50);
}

// Modal window functions
function showModal() {
	containerModalWindow.classList.add("visible");
}

function closeModal() {
	containerModalWindow.classList.remove("visible");
}

btnNo.addEventListener("click", closeModal);
btnYes.addEventListener("click", () => {
	const index = accounts.findIndex(
		(account) => account.owner === currentAccount.owner
	);
	accounts.splice(index, 1);
	currentAccount = undefined;
	containerApp.style.opacity = 0;
	labelWelcome.textContent = "Log in to get started";

	displayNotification("Successfully deleted your account", "success");
	closeModal();
});
