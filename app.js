const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");
const toDate = require("date-fns/toDate");

const app = express();
app.use(express.json());

const dbpath = path.join(__dirname, "todoApplication.db");
let db;

const server_database_connect = async () => {
  try {
    db = await open({ filename: dbpath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("server running http://localhost:3000/covid/");
    });
  } catch (error) {
    console.log(`DB error ${error.message}`);
    process.exit(1);
  }
};

server_database_connect();

const checkqueries = async (request, response, next) => {
  const { todoId } = request.params;
  const { search_q, status, priority, category, date } = request.query;
  if (status !== undefined) {
    const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
    const hasArray = statusArray.includes(status);
    if (hasArray === true) {
      request.status = status;
    } else {
      response.status(400);
      response.send("'Invalid Todo Status");
      return;
    }
  }
  if (priority !== undefined) {
    const priorityArray = ["HIGH", "MEDIUM", "LOW"];
    const haspriority = priorityArray.includes(priority);
    if (haspriority) {
      request.priority = priority;
    } else {
      request.status(400);
      response.send("Invalid Todo Priority");
      return;
    }
  }

  if (category !== undefined) {
    const categoryArray = ["WORK", "HOME", "LEARNING"];
    const hascategory = categoryArray.includes(category);
    if (hascategory) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
      return;
    }
  }

  if (date !== undefined) {
    try {
      const myDate = new Date(date);

      const formatedDate = format(new Date(date), "yyyy-MM-dd");
      const result = toDate(
        new Date(
          `${myDate.getFullYear()}-${myDate.getMonth() + 1}-${myDate.getDate()}`
        )
      );

      const isValidDate = await isValid(result);

      if (isValidDate === true) {
        request.date = formatedDate;
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
    } catch (e) {
      response.status(400);
      response.send("Invalid Due Date");
      return;
    }
  }

  request.todoId = todoId;
  request.search_q = search_q;
  next();
};

//

//

app.get("/todos/", checkqueries, async (request, response) => {
  const {
    search_q = "",
    status = "",
    priority = "",
    category = "",
    date = "",
  } = request;
  console.log(search_q);
  const responsequery = `
    SELECT 
    id, todo,priority, status,category, due_date as dueDate
     FROM todo
     WHERE 
     todo LIKE '%${search_q}%' AND
      status LIKE '%${status}%' AND 
      priority LIKE "%${priority}%" AND 
      category LIKE "%${category}%"
    `;
  const dbresponse = await db.all(responsequery);
  response.send(dbresponse);
});

// todos based on todo ID

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getquery = `
    SELECT
    id, todo,priority, status,category, due_date as dueDate
    FROM
     todo
      WHERE id = ${todoId}
    `;
  const get_res = await db.get(getquery);
  response.send(get_res);
});

//post the todo

app.post("/todos/", async (req, res) => {
  const { id, todo, priority, status, category, dueDate } = req.body;
  console.log(id, todo);
  const postquery = `
    INSERT INTO todo (id, todo, priority, status, category, due_date)
    VALUES (${id}, '${todo}', '${priority}', '${status}', "${category}", "${dueDate}")
    `;
  const pot_res = await db.run(postquery);
  res.send("Todo Successfully Added");
});

// put the deatils as per the given value

const checkBodyDetails = (request, response, next) => {
  const { id, todo, category, priority, status, dueDate } = request.body;
  const { todoId } = request.params;

  if (category !== undefined) {
    categoryArray = ["WORK", "HOME", "LEARNING"];
    categoryIsInArray = categoryArray.includes(category);

    if (categoryIsInArray === true) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
      return;
    }
  }

  if (priority !== undefined) {
    priorityArray = ["HIGH", "MEDIUM", "LOW"];
    priorityIsInArray = priorityArray.includes(priority);
    if (priorityIsInArray === true) {
      request.priority = priority;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
      return;
    }
  }

  if (status !== undefined) {
    statusArray = ["TO DO", "IN PROGRESS", "DONE"];
    statusIsInArray = statusArray.includes(status);
    if (statusIsInArray === true) {
      request.status = status;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
      return;
    }
  }

  if (dueDate !== undefined) {
    try {
      const myDate = new Date(dueDate);
      const formatedDate = format(new Date(dueDate), "yyyy-MM-dd");
      console.log(formatedDate);
      const result = toDate(new Date(formatedDate));
      const isValidDate = isValid(result);
      console.log(isValidDate);
      console.log(isValidDate);
      if (isValidDate === true) {
        request.dueDate = formatedDate;
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
    } catch (e) {
      response.status(400);
      response.send("Invalid Due Date");
      return;
    }
  }
  request.todo = todo;
  request.id = id;

  request.todoId = todoId;

  next();
};
const hasdate = (body) => {
  return (
    body.status === undefined &&
    body.priority === undefined &&
    body.todo === undefined &&
    body.category === undefined &&
    body.dueDate !== undefined
  );
};

app.put("/todos/:todoId/", checkBodyDetails, async (request, response) => {
  const { todoId } = request;

  const { priority, todo, status, category, dueDate } = request;

  let updateTodoQuery = null;

  console.log(priority, todo, status, dueDate, category);
  switch (true) {
    case status !== undefined:
      updateTodoQuery = `
            UPDATE
                todo
            SET 
                status = '${status}'
            WHERE 
                id = ${todoId}     
        ;`;
      await db.run(updateTodoQuery);
      response.send("Status Updated");
      break;
    case priority !== undefined:
      updateTodoQuery = `
            UPDATE
                todo
            SET 
                priority = '${priority}'
            WHERE 
                id = ${todoId}     
        ;`;
      await db.run(updateTodoQuery);
      response.send("Priority Updated");
      break;
    case todo !== undefined:
      updateTodoQuery = `
            UPDATE
                todo
            SET 
                todo = '${todo}'
            WHERE 
                id = ${todoId}     
        ;`;
      await db.run(updateTodoQuery);
      response.send("Todo Updated");
      break;
    case category !== undefined:
      const updateCategoryQuery = `
            UPDATE
                todo
            SET 
                category = '${category}'
            WHERE 
                id = ${todoId}     
        ;`;
      await db.run(updateCategoryQuery);
      response.send("Category Updated");
      break;
    case dueDate !== undefined:
      const updateDateQuery = `
            UPDATE
                todo
            SET 
                due_date = '${dueDate}'
            WHERE 
                id = ${todoId}     
        ;`;
      await db.run(updateDateQuery);
      response.send("Due Date Updated");
      break;
  }
});

//delete the  todo

app.delete("/todos/:todoId/", async (req, res) => {
  const { todoId } = req.params;
  const del_query = `
     DELETE FROM todo WHERE id = ${todoId}
    `;
  const delres = await db.run(del_query);
  res.send("Todo Deleted");
});

//

//

//

//

app.get("/agenda/", checkqueries, async (request, response) => {
  const { date } = request;
  const query = ` 
  SELECT 
  id,todo, priority, status, category, due_date as dueDate
   FROM
    todo 
    WHERE due_date = '${date}'`;
  const datetesponse = await db.all(query);
  console.log(date);
  response.send(datetesponse);
});

module.exports = app;
