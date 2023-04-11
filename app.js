const express=require("express");
const bodyParser=require("body-parser");
const mongoose=require("mongoose");
const _=require("lodash");
const app=express();
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine','ejs');
app.use(express.static("public"));
mongoose.connect('mongodb+srv://ry9048095:rakesh406@cluster0.atns2uj.mongodb.net/?retryWrites=true&w=majority/todolistdb');

const itemschema={
    name:String
}
const Item=mongoose.model("Item",itemschema);
const listschema={
    name:String,
    items:[itemschema]
}
const llist=mongoose.model("llist",listschema);
const item1=new Item({
    name:"welcome to todolist"
});
const item2=new Item({
    name:"write your work on the input section"
});
const item3=new Item({
    name:"hit submit to save your work"
});

const defaultitems=[item1,item2,item3];

app.get("/",function(req,res){
    
    Item.find({}).estimatedDocumentCount().exec().then(function(foundItems){
        //using this if statement we ensure that when the array founditems is empty then insert our defaultitetms array to the database and using this whenever we run our server the items will not inserted inthe array again and again
        if(foundItems.length===0){
            Item.insertMany(defaultitems);
            res.redirect("/");
        }
        else{
            res.render("list",{todaylist:"TODAY's",newlistitems:foundItems});
        }
    })
    .catch(function(err){
        console.log(err);
    });
});

// Creating Dynamic pages using express routing

app.get("/:customlistname",function(req,res){
    const customlistname=_.capitalize(req.params.customlistname);
    llist.findOne({name:customlistname}).estimatedDocumentCount().exec().then(function(foundlist){
        if(!foundlist){
                // console.log("doesn't exits");
                //creating new list
            const List=new llist({
                name:customlistname,
                items:defaultitems
            });
            List.save();
            res.redirect("/"+customlistname);
        }
        else{
                // console.log("exits");
            res.render("list",{todaylist:foundlist.name,newlistitems:foundlist.items});
        }
    })
    .catch(function(err){
        console.log(err);
    });

});
app.post("/",function(req,res){
    //inserting item in our todolist
    const item=req.body.newitem;
    let listname=req.body.button;
    if (listname){     
        listname = listname.trim();   
    }
    const newentity=new Item({
        name:item
    });
    if(listname==="TODAY's"){
        newentity.save();
        res.redirect("/");
    }else{
        llist.findOne({name:listname}).estimatedDocumentCount().exec().then(function(foundlists){
            foundlists.items.push(newentity);
            foundlists.save();
            // console.log(foundlists);
            res.redirect("/"+listname);
        }).catch(err => {
            console.log(err);
        });

    }
});

app.post("/delete",function(req,res){
    const checkeditemid=req.body.check;
    const listName=req.body.listName;
    if(listName==="TODAY's"){
        Item.findByIdAndRemove(checkeditemid).estimatedDocumentCount().exec().then(function(err){
            // if(!err){
            //     console.log("successfully removed");
            // }
            res.redirect("/");
        });
    }else{
        //it will find the item from the listname and from the items array of listschema it will pull the id which is matched the item of items array and update that
        let doc =  llist.findOneAndUpdate({name:listName}, {$pull: {items: {_id: checkeditemid}}}, {
            new: true
            }).estimatedDocumentCount().exec().then(function (foundList)
            {
                res.redirect("/" + listName);
            }).catch( err => console.log(err));
        }
});

let port=process.env.PORT;
if(port==null||port==""){
    port=3000;
}
app.listen(port,function(){
    console.log("server is running ");
});
