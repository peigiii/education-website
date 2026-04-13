const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    role: {
      type: String,
      enum: ['student', 'moderator', 'admin'],
      default: 'student',
    },
    saved_resources: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CourseResource' }],
  },
  { timestamps: true }
);

userSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.password_hash;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
