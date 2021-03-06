const mongoose=require('mongoose')
const validator=require('validator')
const bcrypt=require('bcrypt')
const jwt=require('jsonwebtoken')

const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required: true,
        trim:true
    },
    email:{
        type:String,
        required:true,
        trim:true,
        unique:true,
        lowercase:true,
        validate(value)
        {
            if(!validator.isEmail(value))
            {
                throw new Error('Email is invalid')
            }
        }
    },
    password:{
        type:String,
        required:true,
        minlength:7
    },
    age:{
        type:Number
    },
    mycart:[{
        productid:{
            type:String
        }
    }],
    tokens:[{
        token:{
            type:String,
            required:true
        }
    }]
})

userSchema.methods.toJSON=function()
{
    const user=this
    const userObject=user.toObject()
    delete userObject.password
    delete userObject.tokens
    return userObject
}

userSchema.methods.generateUID=async function()
{
    const user=this
    const token=jwt.sign({id:user.id.toString()},process.env.USERTOKEN)
    user.tokens=user.tokens.concat({token})
    await user.save()
    return token
}

userSchema.statics.findByCredentials=async(email,password)=>
{
    const user=await User.findOne({email})

    if(!user)
    {
        return res.status(404).send('Unable to login')
    }
    const isMatch=await bcrypt.compare(password,user.password)
    if(!isMatch)
    {
        return res.status(400).send('Unable to Login');
    }
    return user
}

userSchema.pre('save',async function(next)
{
    const user=this

    if(user.isModified('password'))
    {
        user.password=await bcrypt.hash(user.password,8)
    }
    next()
})


const User=mongoose.model('User',userSchema)

module.exports=User
