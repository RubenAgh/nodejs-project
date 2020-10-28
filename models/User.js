const { Schema, model } = require('mongoose');

const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    name: String,
    password: {
        type: String,
        required: true
    },
    avatarUrl: String,
    resetToken: String,
    resetTokenExp: Date,
    cart: {
        items: [
            {
                count: {
                    type: Number,
                    required: true,
                    default: 0
                },
                courseId: {
                    type: Schema.Types.ObjectId,
                    ref: 'Course',
                    required: true
                }
            }
        ]  
    }
});

userSchema.methods.addToCart = function(course) {
    const items = this.cart.items.concat();
    const idx = items.findIndex(c => c.courseId.toString() === course._id.toString());
    
    if (idx >= 0) {
        items[idx].count = items[idx].count + 1;
    } else {
        items.push({
            count: 1,
            courseId: course._id
        });
    }   

    this.cart = { items };

    return this.save();
};  

userSchema.methods.removeFromCart = function(id) {
    let items = this.cart.items.concat();
    const idx = items.findIndex(c => c.courseId.toString() === id.toString());

    if (items[idx].count === 1) {
        items = items.filter(c => c.courseId.toString() !== id.toString());
    } else {
        items[idx].count = items[idx].count - 1;
    }   

    this.cart = { items };

    return this.save();
};

userSchema.methods.clearCard = function() {
    this.cart = {items: []};

    return this.save();
};

module.exports = model('User', userSchema);