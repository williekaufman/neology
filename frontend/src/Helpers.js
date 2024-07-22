import { baseURL } from "./Settings";

export function makeRequestOptions(body, method = "POST") {
  if (method === "GET") {
    return {
      method,
      mode: "cors",
      headers: { "Content-Type": "application/json" },
    };
  }
  return {
    method,
    mode: "cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export function fetchWrapper(url, body, method = "POST") {
  let fullUrl = `${baseURL}${url}`;

  if (method === "GET") {
    if (body) {
      const queryParams = new URLSearchParams(body).toString();
      fullUrl = `${fullUrl}?${queryParams}`;
    }
  }
  return fetch(fullUrl, makeRequestOptions(body, method))
    .then((response) => {
      if (!response.ok) {
        // Always print this
        console.log(response.json());
        return {
          success: false,
          error: `Unexpected error on ${url}`,
        };
      }
      return response.json();
    })
    .catch((error) => {
      return {
        success: false,
        error: error.message,
      };
    });
}

const displayNames = [
  "Apple",
  "Banana",
  "Cherry",
  "Date",
  "Elderberry",
  "Fig",
  "Grape",
  "Honeydew",
  "Kiwi",
  "Lemon",
  "Mango",
  "Nectarine",
  "Orange",
  "Papaya",
  "Quince",
  "Raspberry",
  "Strawberry",
  "Tomato",
  "Ugli Fruit",
  "Vanilla",
  "Watermelon",
  "Xigua",
  "Yam",
  "Zucchini",
  "Ant",
  "Bear",
  "Cat",
  "Dog",
  "Elephant",
  "Frog",
  "Giraffe",
  "Horse",
  "Iguana",
  "Jaguar",
  "Kangaroo",
  "Lion",
  "Monkey",
  "Newt",
  "Owl",
  "Penguin",
  "Quail",
  "Rabbit",
  "Snake",
];

export function getUsername(setHowToPlayOpen, reset = false) {
  let username = localStorage.getItem("username");
  let displayName = username ? username.split("#")[1] : null;

  if (!username || !displayName || reset) {
    username = generateRandomUsername(setHowToPlayOpen);
    if (reset) {
      displayName = prompt("Please enter your display name:", "");
    }
    if (!displayName) {
      displayName =
        displayNames[Math.floor(Math.random() * displayNames.length)];
    }
    username = `${username}#${displayName}`;
    localStorage.setItem("username", username);
  }
  return `${username}#${displayName}`;
}

export function getDisplayName(username) {
  return username.split("#")[1];
}

function generateRandomUsername(setHowToPlayOpen) {
  let result = "";
  let characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let charactersLength = characters.length;
  for (let i = 0; i < 16; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  setHowToPlayOpen && setHowToPlayOpen(true);
  return result;
}

export function sample(array, num) {
  const shuffled = array.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, num);
}
