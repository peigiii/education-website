const mongoose = require('mongoose');

const courseResourceSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true },
    module_title: { type: String, required: true },
    resource_type: {
      type: String,
      enum: ['lecture_note', 'video_tutorial', 'interactive_quiz'],
      required: true,
    },
    title: { type: String, required: true },
    content_url: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CourseResource', courseResourceSchema);
