//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash');


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect('mongodb://davidhan:egan25@ds042729.mlab.com:42729/fccprojects', {useNewUrlParser: true});

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

// Creating default items for Items list
const item1 = new Item({
  name: 'Welcome to your to do list!'
});

const item2 = new Item({
  name: 'Hit the + button to add a new item.'
});

const item3 = new Item({
  name: '<-- Hit this to delete an item.'
});

const defaultItems = [item1, item2, item3];

//New List schema
const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model('List', listSchema);

app.get("/", function(req, res) {
  Item.find({}, function(err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log('Successfully saved default items to DB.');
        }
      });
      res.redirect('/');
    } else {
      res.render("list", {listTitle: 'Today', newListItems: foundItems});
    }
  });
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === 'Today') {
    item.save();
    res.redirect('/');
  } else {
    List.findOne({name: listName}, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect('/' + listName);
    })
  }
});

app.get('/:newName', function(req, res) {
  const newName = _.capitalize(req.params.newName);

  List.findOne({name: newName}, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        // Create and save a new list
        const list = new List({
          name: newName,
          items: defaultItems
        });
        list.save();
        res.redirect('/' + newName);
      } else {
        // Show an existing list
        res.render('list', {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  })
});

app.post('/delete', function(req, res) {

  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === 'Today') {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (!err) {
        res.redirect('/');
      }
    })
  } else {
    List.findOneAndUpdate(
      {name: listName},
      {$pull: {items: {_id: checkedItemId}}},
      function(err, foundList) {
        res.redirect('/' + listName);
      });
  }
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
