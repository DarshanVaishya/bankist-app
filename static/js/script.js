"use strict";

/////////////////////////////////////////////////
/////////////////////////////////////////////////
// BANKIST APP

// Globals
let currentAccount,
	currentTimerId = null,
	isSorted = false;

// Data
const account1 = {
	owner: "Jonas Schmedtmann",
	interestRate: 1.2, // %
	pin: 1111,

	movements: [
		[200, "2020-11-18T21:31:17.178Z"],
		[455.23, "2020-12-23T07:42:02.383Z"],
		[-306.5, "2021-01-28T09:15:04.904Z"],
		[25000, "2021-04-01T10:17:24.185Z"],
		[-642.21, "2021-05-08T14:11:59.604Z"],
		[-133.9, "2021-05-27T17:01:17.194Z"],
		[79.97, "2022-01-02T08:22:17.929Z"],
		[1300, "2022-01-07T10:51:36.790Z"],
	],
	currency: "EUR",
	locale: "pt-PT", // de-DE
};

const account2 = {
	owner: "Jessica Davis",
	interestRate: 1.5,
	pin: 2222,

	movements: [
		[5000, "2019-11-01T13:15:33.035Z"],
		[3400, "2019-11-30T09:48:16.867Z"],
		[-150, "2019-12-25T06:04:23.907Z"],
		[-790, "2020-01-25T14:18:46.235Z"],
		[-3210, "2020-02-05T16:33:06.386Z"],
		[-1000, "2020-04-10T14:43:26.374Z"],
		[8500, "2020-06-25T18:49:59.371Z"],
		[-30, "2020-07-26T12:01:20.894Z"],
	],
	currency: "USD",
	locale: "en-US",
};

const accounts = [account1, account2];

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
 * Returns the sum of the array
 * @this {number[]}
 * @returns number
 */
Array.prototype.sum = function () {
	return this.reduce((accu, current) => accu + current);
};

/**
 * Returns an array with the movements of current account
 * @returns {number[]}
 */
function getMovements() {
	return currentAccount.movements.map((record) => record[0]);
}

/**
 * Returns how many days have passed since given date
 * @param {Date} date
 * @returns {String}
 */
function daysPassedSince(date) {
	let result = Math.round(
		Math.abs((date - new Date()) / (1000 * 60 * 60 * 24))
	);

	if (result === 0) result = "today";
	else if (result === 1) result = "yesterday";
	else if (result <= 7) result = `${result} days ago`;
	return String(result);
}

/**
 * Returns an array containing formatted date and time
 * @param {Date} date
 * @returns {[Date, String]}
 */
function getDateTime(date) {
	let options = {
		day: "numeric",
		month: "numeric",
		year: "numeric",
	};
	const dateFull = new Intl.DateTimeFormat(
		currentAccount.locale,
		options
	).format(date);

	options = {
		hour: "numeric",
		minute: "numeric",
	};
	const time = new Intl.DateTimeFormat(currentAccount.locale, options).format(
		date
	);
	return [dateFull, time];
}

/**
 * Returns given number in currency format
 * @param {number} movement
 * @returns {String}
 */
function currencyFormatter(movement) {
	return new Intl.NumberFormat(currentAccount.locale, {
		style: "currency",
		currency: currentAccount.currency,
	}).format(movement);
}

/**
 * Given an array of numbers, it will parse, create an element and insert them into the movements container inside the DOM.
 * @param {number[]} account
 */
function displayMovements(account, sort = false) {
	containerMovements.innerHTML = "";

	const movs = sort
		? account.movements.slice().sort((a, b) => a[0] - b[0])
		: account.movements;

	movs.forEach((movement) => {
		const type = movement[0] < 0 ? "debit" : "credit";
		const date = new Date(movement[1]);
		let result = daysPassedSince(date);
		let amount = currencyFormatter(movement[0]);

		if (!result.includes("day")) result = getDateTime(date)[0];
		const element = `<div class="movements__row">
		<div class="movements__type movements__type--${type}">${type}</div>
		<div class="movements__date">${result}</div>
		<div class="movements__value">${amount}</div>
	</div>`;

		containerMovements.insertAdjacentHTML("afterbegin", element);
	});
}

/**
 * Calculates the sum of all the transactions and displays the sum on current balance element on the DOM.
 * @param {number[]} movements
 */
function calcDisplayBalance(movements) {
	const balance = +movements.reduce((sum, current) => sum + current).toFixed(2);
	labelBalance.textContent = currencyFormatter(balance);
	currentAccount.balance = balance;
}

/**
 * Given an array of numbers, it will display all the deposits and withdrawals as well as the interest generated in the DOM.
 * @param {number[]} movements
 */
function calcDisplaySummary(movements) {
	// Calculating the deposits
	const deposits = movements
		.filter((movement) => movement > 0)
		.sum()
		.toFixed(2);
	labelSumIn.textContent = currencyFormatter(deposits);

	// Calculating the withdrawals
	const withdrawals = movements
		.filter((movement) => movement < 0)
		.sum()
		.toFixed(2);
	labelSumOut.textContent = currencyFormatter(Math.abs(withdrawals));

	// Calculating the interest
	const interest = movements
		.filter((movement) => movement > 0)
		.map((mov) => (mov * currentAccount.interestRate) / 100)
		.filter((mov) => mov >= 1)
		.sum()
		.toFixed(2);
	labelSumInterest.textContent = currencyFormatter(interest);
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
 * Updates the date in the DOM
 */
function displayBalanceDate() {
	const now = new Date();
	const date = getDateTime(now);
	labelDate.textContent = `${date[0]}, ${date[1]}`;
}

/**
 * Starts the logout timer, and stops the older one.
 */
function startLogoutTimer() {
	let time = 120;

	if (currentTimerId) clearInterval(currentTimerId);

	currentTimerId = setInterval(() => {
		time--;
		const min = String(Math.floor(time / 60)).padStart(2, 0);
		const secs = String(time % 60).padStart(2, 0);
		labelTimer.textContent = `${min}:${secs}`;

		if (time < 1) {
			clearInterval(currentTimerId);
			currentTimerId = null;
			labelWelcome.textContent = "Log in to get started";
			containerApp.style.opacity = 0;
			displayNotification("Session expired. Please log in again.", "warning");
			window.scrollTo(0, 0);
		}
	}, 1000);
}

/**
 * Updates the UI for the given array of movements.
 * @param {number[]} movements
 */
function updateUI(movements) {
	displayMovements(currentAccount);
	calcDisplayBalance(movements);
	calcDisplaySummary(movements);
	displayBalanceDate();
	startLogoutTimer();
}

document.body.addEventListener("click", () => {
	clearInterval(currentTimerId);
	startLogoutTimer();
});

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
		updateUI(getMovements());
		document.body.style.overflowY = "visible";

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
		currentAccount.movements.push([-1 * amount, new Date().toISOString()]);
		receiverAcc.movements.push([amount, new Date().toISOString()]);

		inputTransferAmount.value = inputTransferTo.value = "";
		inputTransferAmount.blur();
		inputTransferTo.blur();
		displayNotification(
			`Successfully transferred ${amount} to ${receiverAcc.owner}`,
			"success"
		);
	}

	updateUI(getMovements());
});

btnClose.addEventListener("click", (event) => {
	event.preventDefault();

	if (
		inputCloseUsername.value === currentAccount.username &&
		+inputClosePin.value === currentAccount.pin
	) {
		document.body.style.overflow = "hidden";
		showModal();
	} else {
		displayNotification("Invalid username or pin entered", "error");
	}
});

btnLoan.addEventListener("click", (e) => {
	e.preventDefault();
	const amount = Math.floor(inputLoanAmount.value);
	if (
		amount > 0 &&
		currentAccount.movements.some((mov) => mov[0] >= amount * 0.1)
	) {
		currentAccount.movements.push([amount, new Date().toISOString()]);
		updateUI(getMovements());
		displayNotification(`Loan granted!`, "success");
		inputLoanAmount.value = "";
		inputLoanAmount.blur();
	} else if (!amount || amount <= 0) {
		displayNotification("Enter a valid loan amount", "warning");
	} else {
		displayNotification("Not enough balance. Take a smaller loan.", "error");
	}
});

btnSort.addEventListener("click", (event) => {
	event.preventDefault();
	displayMovements(currentAccount, !isSorted);
	isSorted = !isSorted;
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
	document.body.style.overflow = "visible";
}

btnNo.addEventListener("click", closeModal);
btnYes.addEventListener("click", () => {
	const index = accounts.findIndex(
		(account) => account.owner === currentAccount.owner
	);
	accounts.splice(index, 1);
	currentAccount = null;
	containerApp.style.opacity = 0;
	labelWelcome.textContent = "Log in to get started";

	displayNotification("Successfully deleted your account", "success");
	closeModal();
});

window.onbeforeunload = function () {
	window.scrollTo(0, 0);
};
