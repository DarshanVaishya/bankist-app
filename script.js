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

const accounts = [account1, account2, account3, account4];

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

const btnLogin = document.querySelector(".login__btn");
const btnTransfer = document.querySelector(".form__btn--transfer");
const btnLoan = document.querySelector(".form__btn--loan");
const btnClose = document.querySelector(".form__btn--close");
const btnSort = document.querySelector(".btn--sort");

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
function displayMovements(movements) {
	containerMovements.innerHTML = "";
	movements.forEach((movement, index) => {
		const type = movement < 0 ? "withdrawal" : "deposit";
		const element = `<div class="movements__row">
		<div class="movements__type movements__type--${type}">${index + 1} ${type}</div>
		<div class="movements__date">3 days ago</div>
		<div class="movements__value">${movement}€</div>
	</div>`;

		// containerMovements.innerHTML += element;
		containerMovements.insertAdjacentHTML("afterbegin", element);
	});
}

/**
 * @param {number[]} movements
 */
function calcDisplayBalance(movements) {
	const balance = movements.reduce((sum, current) => sum + current);
	labelBalance.textContent = `${balance}€`;
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

btnLogin.addEventListener("click", (event) => {
	event.preventDefault();

	currentAccount = accounts.find(
		(acc) => acc.username === inputLoginUsername.value
	);

	if (currentAccount?.pin === +inputLoginPin.value) {
		console.log("CORRECT PIN");
		labelWelcome.textContent = `Welcome back, ${
			currentAccount.owner.split(" ")[0]
		}`;
		containerApp.style.opacity = 1;

		// Clearing inputs
		inputLoginUsername.value = inputLoginPin.value = "";
		inputLoginPin.blur();

		// Populating with data
		displayMovements(currentAccount.movements);
		calcDisplayBalance(currentAccount.movements);
		calcDisplaySummary(currentAccount.movements);
	} else {
		console.log("WRONG PIN");
	}
});
