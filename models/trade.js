const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TradeSchema = new Schema({
        
        type: {
            type: String,
            required: true
        },

        userId: {
            type: Schema.Types.ObjectId,
            ref: 'users'
        },


        symbol: {
            type: String
        },

        shares:{
            type: Number
        },

        price: {
            type: Number
        }
}, {
    timestamps: true
});


module.exports = mongoose.model('trades', TradeSchema);