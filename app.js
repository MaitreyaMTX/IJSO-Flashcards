let currentCard = 0;
let filteredCards = [];

const cardElement = document.getElementById("card");

const question = document.getElementById("question");
const short = document.getElementById("short");
const answer = document.getElementById("answer");
const explanation = document.getElementById("explanation");
const memory = document.getElementById("memory");

const counter = document.getElementById("counter");
const subject = document.getElementById("subject");

const search = document.getElementById("search");
const filter = document.getElementById("filter");


/*
    Load saved progress
*/

let saved =
    localStorage.getItem("ijso-progress");

let start =
    saved ? Number(saved) : 0;



currentCard = start;


/*
    Initial cards
*/

filteredCards = flashcards;


function loadCard() {


    if (filteredCards.length === 0) {

        question.textContent =
            "No cards found";

        short.textContent =
            "";

        answer.textContent =
            "";

        return;

    }


    let card =
        filteredCards[currentCard];


    question.textContent =
        card.question;


    short.textContent =
        card.short;


    answer.textContent =
        card.answer;


    explanation.textContent =
        card.explanation;


    memory.textContent =
        card.memory;


    subject.textContent =
        card.subject;


    counter.textContent =
        `Card ${currentCard + 1} / ${filteredCards.length}`;


    cardElement.classList.remove(
        "flipped"
    );


    localStorage.setItem(
        "ijso-progress",
        currentCard
    );

}



function nextCard(){


    currentCard++;


    if(currentCard >= filteredCards.length){

        currentCard = 0;

    }


    loadCard();

}



function previousCard(){


    currentCard--;


    if(currentCard < 0){

        currentCard =
            filteredCards.length - 1;

    }


    loadCard();

}



function flipCard(){

    cardElement.classList.toggle(
        "flipped"
    );

}




/*
 Buttons
*/

document
.getElementById("next")
.onclick =
nextCard;


document
.getElementById("prev")
.onclick =
previousCard;


document
.getElementById("flip")
.onclick =
flipCard;



/*
 Search
*/


search.addEventListener(
"input",
()=>{


let text =
search.value.toLowerCase();


filteredCards =
flashcards.filter(card =>

card.question
.toLowerCase()
.includes(text)

||
card.answer
.toLowerCase()
.includes(text)

);


currentCard = 0;


loadCard();


});




/*
 Subject filter
*/


filter.addEventListener(
"change",
()=>{


let value =
filter.value;


if(value === "all"){

    filteredCards =
    flashcards;

}

else {


    filteredCards =
    flashcards.filter(card =>

        card.subject === value

    );

}


currentCard = 0;


loadCard();


});





/*
 Keyboard shortcuts
*/


document.addEventListener(
"keydown",
(e)=>{


if(e.key === "ArrowRight"){

    nextCard();

}


if(e.key === "ArrowLeft"){

    previousCard();

}


if(e.key === " "){

    e.preventDefault();

    flipCard();

}


});




/*
 Start app
*/

loadCard();
