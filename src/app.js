import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"


const app = express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    Credential: true
}))
app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended: true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser()) 

// route import
import userRoute from "./routes/user.route.js"

// app.use((req, res, next) => {
//   console.log("Headers:", req.headers);
//   console.log("Files:", req.files);
//   next();
// });


app.use(express.json());
//router declaration
app.use('/api/v1/users',userRoute)

export{app}