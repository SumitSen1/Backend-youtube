import multer from "multer"
import fs from "fs"
import path from "path"

const uploadDir = path.join(process.cwd(), "../public/temp");

console.log("multer-middleware/uploadDir",uploadDir);

if(!fs.existsSync(uploadDir)){
   fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
     cb(null, file.originalname )
    // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    // cb(null, file.fieldname + '-' + uniqueSuffix)

  }
})

export const upload = multer({ storage })