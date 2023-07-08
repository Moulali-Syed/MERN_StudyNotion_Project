const RatingAndReview = require('../models/RatingAndReview');
const Course = require('../models/Course');

//createRating
exports.createRating = async (req, res) => {
  try {
    //get userId
    const userId = req.user.id;
    //fetch data from request body
    const { rating, review, courseId } = req.body;
    //check if user is enrolled or not
    const courseDetails = await Course.findOne({
      _id: courseId,
      studentsEnrolled: { $elemMatch: { $eq: userId } },
    });
    if (!courseDetails) {
      return res.status(404).json({
        success: false,
        message: 'Student not enrolled in the course',
      });
    }
    //check if user already reviewed the course
    const alreadyReviewed = await RatingAndReview.findOne({
      user: userId,
      course: courseId,
    });
    if (alreadyReviewed) {
      return res.status(403).json({
        success: false,
        message: 'Course is already reviewed by the user',
      });
    }
    //create rating and review
    const ratingAndReview = await RatingAndReview.create({
      rating,
      review,
      course: courseId,
      user: userId,
    });
    //update the course with ratingAndReview
    const updatedCourseDetails = await Course.findByIdAndUpdate(
      { _id: courseId },
      {
        $push: { ratingAndReviews: ratingAndReview._id },
      },
      { new: true }
    );
    console.log(updatedCourseDetails);
    //return response
    return res.status(200).json({
      success: true,
      message: 'Rating and Review Created Successfully',
      ratingAndReview,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
//getAverageRating - //we apply aggregation
exports.getAverageRating = async (req, res) => {
  try {
    //getCourseId
    const courseId = req.body.courseId;
    //calculate average rating
    const result = await RatingAndReview.aggregate([
      {
        $match: {
          course: new mongoose.Types.ObjectId(courseId),
        },
      },
      { $group: { _id: null, averageRating: { $avg: '$rating' } } },
    ]);
    //return rating
    if (result.length > 0) {
      return res
        .status(200)
        .json({ success: true, averageRating: result[0].averageRating });
    }

    //if no rating and review exists
    return res.status(200).json({
      success: true,
      averageRating: 0,
      message: 'Average rating is 0 , no ratings given till now',
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
//getAllRating
exports.getAllRating = async (req, res) => {
  try {
    const allReviews = await RatingAndReview.find({})
      .sort({ rating: 'desc' })
      .populate({ path: 'user', select: 'firstName lastName email image' })
      .populate({ path: 'course', select: 'courseName' })
      .exec();

    return res.status(200).json({
      success: true,
      data: allReviews,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
