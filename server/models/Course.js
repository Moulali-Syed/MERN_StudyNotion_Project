const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  courseName: {
    type: String,
    trim: true,
    required: true,
  },
  courseDescription: {
    type: String,
    trim: true,
    required: true,
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  WhatYouWillLearn: {
    type: String,
    required: true,
    trim: true,
  },
  courseContent: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
    },
  ],
  ratingAndReviews: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RatingAndReview',
    },
  ],
  price: {
    type: Number,
    required: true,
  },
  thumbnail: {
    type: String,
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  },
  tag: {
    type: String,
  },
  studentsEnrolled: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  ],
  instructions: {
    type: [String],
  },
  status: {
    type: String,
    enum: ['Draft', 'Published'],
  },
});

module.exports = mongoose.model('Course', courseSchema);
