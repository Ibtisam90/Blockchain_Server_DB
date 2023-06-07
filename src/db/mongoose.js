const mongoose = require('mongoose')

// const conn = mongoose.connect('mongodb://127.0.0.1:27017/elections',{
//     useNewUrlParser: true,
//     useCreateIndex: true,
//     useUnifiedTopology: true
// })

mongoose.connect(
    `mongodb+srv://shafaq:shasha@cluster0.2gd3a4o.mongodb.net/`,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
        //useCreateIndex: true
    }).then(() => {
      console.log('Database connected');
});