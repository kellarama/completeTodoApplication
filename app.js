const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const addDays = require("date-fns/addDays");
const format = require("date-fns/format");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Server is running");
    });
  } catch (err) {
    console.log(err.message);
    process.exit(1);
  }
};

initializeDbAndServer();

const checkStatus = (request) => {
  return request.status !== undefined;
};
const checkPriority = (request) => {
  return request.priority !== undefined;
};
const checkPriorityAndStatus = (request) => {
  return request.priority !== undefined && request.status !== undefined;
};
const checkSearch = (request) => {
  return request.search_q !== undefined;
};
const checkCategoryAndStatus = (request) => {
  return request.priority !== undefined && request.status !== undefined;
};
const checkCategory = (request) => {
  return request.category !== undefined;
};
const checkCategoryAndPriority = (request) => {
  return request.category !== undefined && request.priority !== undefined;
};
app.get("/todos/", async (request, response) => {
  let sendResponse = null;
  const { search_q, status, priority, category } = request.query;
  switch (true) {
    case checkPriorityAndStatus(request.query):
      const getPriorityAndStatus = `SELECT * 
                FROM 
                todo 
                WHERE 
                priority LIKE '${priority}' 
                AND 
                status LIKE '${status}';`;
      sendResponse = await db.all(getPriorityAndStatus);
      break;
    case checkCategoryAndStatus(request.query):
      const getCategoryAndStatus = `SELECT * 
                FROM 
                todo 
                WHERE 
                category LIKE '${category}'
                AND 
                status LIKE '${status}';`;
      sendResponse = await db.all(getCategoryAndStatus);
      break;
    case checkCategoryAndPriority(request.query):
      const getCategoryAndPriority = `SELECT * 
                FROM 
                todo 
                WHERE 
                category LIKE '${category}'
                AND 
                priority LIKE '${priority}';`;
      sendResponse = await db.all(getCategoryAndPriority);
      break;
    case checkCategory(request.query):
      const getCategory = `SELECT * 
                FROM 
                todo 
                WHERE 
                category LIKE '${category}';`;
      sendResponse = await db.all(getCategory);
      if (sendResponse.length === 0) {
        response.status(400);
        sendResponse = "Invalid Todo Category";
      }
      break;
    case checkSearch(request.query):
      const getSearch = `SELECT * 
                FROM 
                todo 
                WHERE 
                todo LIKE '%${search_q}%';`;
      sendResponse = await db.all(getSearch);
      break;
    case checkStatus(request.query):
      const getStatus = `SELECT * 
                FROM 
                todo 
                WHERE 
                status LIKE '${status}';`;
      sendResponse = await db.all(getStatus);
      if (sendResponse.length === 0) {
        response.status(400);
        sendResponse = "Invalid Todo Status";
      }
      break;
    case checkPriority(request.query):
      const getPriority = `SELECT * 
                FROM 
                todo 
                WHERE 
                priority LIKE '${priority}';`;
      sendResponse = await db.all(getPriority);
      if (sendResponse.length === 0) {
        response.status(400);
        sendResponse = "Invalid Todo Priority";
      }
      break;

    default:
      break;
  }
  response.send(sendResponse);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getQueryById = `SELECT * FROM todo WHERE id = ${todoId};`;
  const res = await db.get(getQueryById);
  response.send(res);
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const dateArray = date.split("-");
  console.log(dateArray);
  let newDate = format(
    new Date(
      parseInt(dateArray[0]),
      parseInt(dateArray[1]) - 1,
      parseInt(dateArray[2])
    ),
    "yyyy-MM-dd"
  );
  console.log(newDate);
  const getDateQuery = `SELECT * FROM todo WHERE due_date LIKE '${newDate}';`;
  const resDate = await db.all(getDateQuery);
  if (resDate.length === 0) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    response.send(resDate);
  }
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;

  const addTodo = `INSERT INTO todo (id,todo,priority,status,category,due_date)
        VALUES (${id},'${todo}','${priority}','${status}','${category}','${dueDate}');`;
  await db.run(addTodo);
  response.send("Todo Successfully Added");
});

const checkDueDate = (request) => {
  return request.dueDate !== undefined;
};

const checkTodo = (request) => {
  return request.todo !== undefined;
};

const updateTodo = (status, array, id) => {
  let column = array[0];
  let updateQuery = `UPDATE todo SET ${column} = '${status}' WHERE id = ${id};`;
  return updateQuery;
};

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let res = null;
  const { status, priority, todo, category, dueDate } = request.body;
  let propertiesArray = Object.getOwnPropertyNames(request.body);
  switch (true) {
    case checkStatus(request.body):
      res = updateTodo(status, propertiesArray, todoId);
      break;
    case checkPriority(request.body):
      res = updateTodo(priority, propertiesArray, todoId);
      break;
    case checkCategory(request.body):
      res = updateTodo(category, propertiesArray, todoId);
      break;
    case checkDueDate(request.body):
      res = updateTodo(dueDate, propertiesArray, todoId);
      break;
    case checkTodo(request.body):
      res = updateTodo(todo, propertiesArray, todoId);
      break;
  }
  await db.run(res);
  response.send(`${propertiesArray[0]} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `DELETE FROM todo WHERE id=${todoId};`;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});
