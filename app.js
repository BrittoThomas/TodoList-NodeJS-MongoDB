// Export
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const _ = require("lodash");

// Initial Export Package Setup
app.use(bodyParser.urlencoded({
  extended: true
}));
app.set("view engine", "ejs");
app.use(express.static("public"));

// Server Setup
app.listen(3000, function() {
  console.log("Server is ready");
});


// Mongo DB Set Up
mongoose.connect("mongodb://localhost:27017/todolistDB", {
  useNewUrlParser: true
});

// Mongoose Schema
const itemsSchema = {
  name: String
};

const listSchema = {
  name: String,
  items: [itemsSchema]
};

// Mongoose Model
const Item = new mongoose.model("Item", itemsSchema);
const List = new mongoose.model("List", listSchema);

// Default Items
const item1 = new Item({
  name: "Welcome to todo list"
});

const item2 = new Item({
  name: "Hit the + button to add new item"
});

const item3 = new Item({
  name: "<- Click here to delete"
});

const defaultItems = [item1, item2, item3];


//Get Home Route - Default List
app.get("/", function(req, res) {
  Item.find({}, function(err, items) {
    if (items.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully added default items.");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        "listTitle": "Today",
        "items": items
      });
    }
  });
});

//Post Home Route - Add New Item on default List
app.post("/", function(req, res) {
  const listName = req.body.list;
  const itemName = req.body.newItem;
  const item = Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({
      name: listName
    }, function(err, list) {
      if (!err) {
        if (list) {
          list.items.push(item);
          list.save();
          res.redirect("/" + listName);
        }
      } else {
        console.log(err);
      }
    });
  }
});

//Delete Item in default List
app.post("/delete", function(req, res) {

  const itemId = req.body.itemId;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(req.body.item, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully deleted.");
        res.redirect("/");
      }
    });
  } else {

    List.findOneAndUpdate({
        name: listName
      }, {
        $pull: {
          items: {
            _id: itemId
          }
        }
      },
      function(err, results) {
        if (!err) {
          res.redirect("/" + listName);
        }
      });
  }
});

//Custom List Route
app.get("/:listName", function(req, res) {
  const listName = _.capitalize(req.params.listName);
  List.findOne({
    name: listName
  }, function(err, list) {
    if (!err) {
      if (!list) {
        //New List
        const newList = List({
          name: listName,
          items: defaultItems
        });
        newList.save();
        res.redirect("/" + listName);
      } else {
        //Existing List
        res.render("list", {
          "listTitle": list.name,
          "items": list.items
        });
      }
    } else {
      console.log(err);
    }
  });
});
