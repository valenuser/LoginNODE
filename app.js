const express = require('express')

const app = express()


//capturar datos del formulario
app.use(express.urlencoded({extended:false}))
app.use(express.json())


const dotenv = require('dotenv')
dotenv.config({path:'./env/.env'})


app.use('/resource',express.static('public'))
app.use('/resources',express.static(__dirname+'/public'))

//motor de plantillas

app.set('view engine','ejs')

//invocamos a bcryptjs

const bcryptjs = require('bcryptjs')

//variable de session

const session = require('express-session')
app.use(session({
    secret:'secret',
    resave:true,
    saveUninitialized:true
}))

const pool = require('./database/db')

//rutas


app.get('/login',(req,res)=>{
    res.render('login',{msg:'esto es un mensaje desde node'})
})

app.get('/register',(req,res)=>{
    res.render('register')
})


//Registration

app.post('/register', async(req,res)=>{
    const user = req.body.user;
    const name = req.body.name;
    const rol = req.body.rol;
    const pass = req.body.pass;
    //encripta la contraseña
    let passwordHaash = await bcryptjs.hash(pass,8)
    pool.query('insert into users set ?',{user:user,name:name,rol:rol,pass:passwordHaash},(error,results)=>{
        if(error){
            console.log(error);
        }else{
            res.render('register',{
                alert:true,
                alertTitle:"Registration",
                alertMessage:"¡Successful Registration!",
                alertIcon:'success',
                showConfirmButton:false,
                time:1500,
                ruta:''
            })
        }
    })
})

//autenticacion

app.post('/auth', async(req,res)=>{
    const user = req.body.user
    const pass = req.body.pass
    let passwordHash = await bcryptjs.hash(pass,8)

    if(user && pass){
        pool.query('select * from users where user = ?',[user], async(error,results)=>{
            if(results.length == 0 || !(await bcryptjs.compare(pass,results[0].pass))){
                res.render('login',{
                    alert:true,
                    alertTitle:"Error",
                    alertMessage:"Usuario y/o password incorrectas",
                    alertIcon:'error',
                    showConfirmButton:true,
                    time:false,
                    ruta:'login'
                })
            }else{
                req.session.loggedin = true;
                req.session.name = results[0].name
                res.render('login',{
                    alert:true,
                    alertTitle:"Conexion exitosa",
                    alertMessage:"¡LOGIN CORRECTO!",
                    alertIcon:'success',
                    showConfirmButton:false,
                    time:1500,
                    ruta:''
                })
            }
        })
    }else{
        res.render('login',{
            alert:true,
            alertTitle:"Advertencia!",
            alertMessage:"¡Por favor ingrese un usuario y/o password!",
            alertIcon:'warning',
            showConfirmButton:false,
            time:1500,
            ruta:'login'
        })
    }
})


// autenticacion paginas

app.get('/',(req,res)=>{
    if(req.session.loggedin){
        res.render('index',{
            login: true,
            name: req.session.name
        })
    }else{
        res.render('index',{
            login:false,
            name:'Debe iniciar sesion'
        })
    }
})


//logout
app.get('/logout',(req,res)=>{
    req.session.destroy(()=>{
        res.redirect('/')
    })
})

app.listen(3000,(req,res)=>{
    console.log('SERVER RUNNING IN http://localhost:3000');
})