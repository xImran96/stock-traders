const fastify = require('fastify')({ logger: true })
const mongoose = require('mongoose');
const User = require('./models/user');
const Trade = require('./models/trade');



fastify.get('/', (req, res)=>{
    res.send('Salam From Fastify');
});



fastify.post('/users', (req, res) => {
      
  const user = new User();
  user.name = req.body.name;
  user.email = req.body.email;

  user.save()
  .then((result) => {
      res.send(result)
  }).catch((err) => {
    console.log(err);
  })

});


fastify.delete('/trades/erase', (req, res) => {

  
Trade.deleteMany({}).then((result)=>{
    res.status(201).send({
        status:  200,
        data: "Trade recordes are deleted.." 
      });
  }).catch((err)=>{
    console.log(err);
  });

});


fastify.post('/trades', (req, res) => {

    const newTrade = new Trade({
        type: req.body.type,
        userId: req.body.userId,
        symbol: req.body.symbol,
        shares: req.body.shares,
        price: req.body.price

    });

  newTrade.save().then((result)=>{
      res.status(201).send({
          status:  200,
          result:  result
        });
    }).catch((err)=>{
      console.log(err);
    });

});


fastify.get('/trades', (req, res) => {

  Trade.find().populate('userId')
        .then((trades)=>{
              res.status(200).send({
                status: 200,
                data: trades
              })
        }).catch((err)=>{
          console.log(err);
        })

});

fastify.get('/trades/users/:id', (req, res) => {

  Trade.find({ userId: req.params.id.toString() })
        .then((trades)=>{
          if(trades.length === 0){
            return  res.status(404).send({
              status: 404,
              data: "No record found"
            });
          }
              res.status(200).send({
                status: 200,
                data: trades
              })
        }).catch((err)=>{
          console.log(err);
        });

});

fastify.get('/stocks/:symbol/price', async (req, res) => {


  try {
      
    const records = await Trade.find({ symbol: req.params.symbol,
      createdAt: {
            $gt: new Date(req.query.start_date),
            $lt: new Date(req.query.end_date)
    }
  });

  if(records.length === 0){
    const error = new Error('There are no trades in the given date range')
    error.statusCode = 404;
    throw error;
  }

    let hPrice = 0;
    records.filter(rec=>{
      if(hPrice < rec.price){
          hPrice = rec.price;
      }
    });

    let lPrice = hPrice
    records.filter(rec=>{
      if(lPrice >= rec.price){
          lPrice = rec.price;
      }
    });

    res.status(200).send({
      symbol: req.params.symbol,
      highest: hPrice,
      lowest: lPrice

    });

  }catch(err){

      console.log(err);
      res.status(err.statusCode).send(err);
  }
     
});



fastify.get('/stocks/stats', async (req, res) => {


  try {
      
    const stocks = await Trade.distinct('symbol');


    let resData = [];

    for(let i = 0; i < stocks.length; i++){
        
      let stockRecs =  await Trade.find({ symbol: stocks[i],
          createdAt: {
                $gt: new Date(req.query.start_date),
                $lt: new Date(req.query.end_date)
        }
      });

      if(stockRecs.length === 0){
        resData.push({
          
            stock: stocks[i],
            message: "There are no trades in the given date range"
  
        })
      }else{
        let currentPrice = stockRecs[0].price;
        let fluctuation = 0;
        let max_rise = 0;
        let max_fall = 0;
        let count = 0;

        stockRecs.forEach((item,  index)=>{
          count++;
            if(item.price > currentPrice){
                max_rise = item.price-currentPrice;
            }else if(item.price < currentPrice){
                max_fall = currentPrice-item.price;
              } 
        })
        
       resData.push({
          stock: stocks[i],
          fluctuations: count>=3? 1:0,
          max_rise: max_rise,
          max_fall: max_fall
        });
      }
    }


   return res.status(200).send(resData);

  }catch(err){

      console.log(err);
      res.status(err.statusCode).send(err);
  }
     
});




mongoose.connect('mongodb://localhost:27017/stocktraders', { useNewUrlParser: true, useUnifiedTopology: true }).then(()=>{
  console.log('connected')
  const start = async () => {
    try {
      await fastify.listen(3000)
    } catch (err) {
      fastify.log.error(err)
      process.exit(1)
    }
  }
  start();


}).catch((err)=>{
    console.log(err)
})



