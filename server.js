const fs = require('fs-extra');
const path = require('path');
const ejs  =require('ejs')
const bodyParser = require('body-parser');
const express = require('express');
const errorHandler = require('./middleware/errorHandler');
const { check, validationResult } = require('express-validator');
const exp = require('constants');

const app = express();


// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

//static files middleware
app.use(express.static('public'));


app.listen(3000,()=>{
    console.log('starting our server on port 3000');
})

app.set('view engine','ejs')

const basePath = path.join(__dirname,'data');


const getFiles =async ()=>{
    const files = await fs.readdir(basePath);
    console.log(files);
    return files;
}

//just tmp var to see if the redirection issue is solved or not after creating file 

app.get('/',async (req,res,next)=>{

    try{
        const files =await  getFiles();
        if(!files){
            throw new Error('There is no files ')
        }
        const filesNames = files.map(file=>path.parse(file));
        console.log('file names :',filesNames)
        res.render('index',{names:filesNames});
    
    }
    catch(error){
        
        next(error);
    }

    //will list of our files
   // res.render('index')
})


//deleting file
app.post('/delete/:filename', (req,res,next)=>{

    const filename = req.params.filename;
    const filePath  = path.join(basePath,filename);

    fs.unlink(filePath,(err)=>{
        if(err){
            next(err);
        }
        else{
            res.redirect('/');
        }
    })
    
})

//rename the file
app.post('/rename/:filename',(req,res,next)=>{
    const prevName = req.params.filename;
    const newName = req.body.name;

    console.log(`prev name:${prevName}} new name:${newName}`);

    const filePath = path.join(basePath,prevName);
    const newFilePath = path.join(basePath,newName);
    console.log(newFilePath)
    console.log(filePath);
    fs.rename(filePath,newFilePath,(err)=>{
        if(err){
            console.log('rename error:',err);
            next(err);
        }

        console.log(`${prevName} is renamed to ${newName}`);
        res.redirect('/');
    })
})

//detail for each file
app.get('/files/:filename',async (req,res,next)=>{

    //parsing the file name form the url
    const fileName = req.params.filename;
    console.log('file name:',fileName)

    try{
        //getting the files inside our data folder
        const files = await getFiles();
        console.log('files',files);
        //create the path of the intended file
        const ourFile = files.filter(file => path.parse(file).base===fileName).map(file => path.join(basePath,file));
        //check if we found the file or not
        if(ourFile.length === 0){
            throw new Error('file not found');
        }
        console.log('matched file',ourFile);
        //reading the content from the file
        const data = await fs.readFile(ourFile[0],'utf-8');
        //check if it is empty file 
        if(data.length<=0){
            throw new Error('Empty file');
        }
        console.log('the content',data);
        //send the data to the client after checking its type
        try{
            const jsonContent = JSON.parse(data);
            res.render('details',{fileType:'json',content:jsonContent})
        }
        catch(err){
            res.render('details',{fileType:'text',content:data});

        }
    }
    catch(error){
        return next(error);
    }

});

//creating new file
app.get('/create',(req,res)=>{
    res.render('create');
})
app.post('/create',[check('title','the name must be +3 characters long').exists().isLength({min:3})],(req,res,next)=>{
    //handling creating new form
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array());
    }

    const fileName = req.body.title.endsWith('.txt')?req.body.title:`${req.body.title}.txt`
    fs.writeFile(path.join(basePath,fileName),req.body.content,err=>{
        if(err){
            next(err);
        }
        else{
            res.redirect('/');
        }
    });

    
})

//error handling
app.use(errorHandler);
