const Course = require('../models/Course');
const Tag = require('../models/Tag');
const User = require('../models/User');
const { uploadImageToCloudinary } = require('../utils/imageUploader');

//createCourse Handler
exports.createCourse = async (req, res) => {
  try {
    //data fetch
    const { courseName, courseDescription, whatYouWillLearn, price, tag } =
      req.body;
    //get thumbnail - file fetch
    const thumbnail = req.files.thumbnailImage;
    //validation
    if (
      (!courseName,
      !courseDescription,
      !whatYouWillLearn,
      !price,
      !tag,
      !thumbnail)
    ) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }
    //instructor protected route - we fetch the userId
    const userId = req.user.id;
    const instructorDetails = await User.findById(userId);

    console.log(instructorDetails);
    if (!instructorDetails) {
      return res.status(404).json({
        success: false,
        message: 'Instructor Details Not Found',
      });
    }
    //check valid tag
    const tagDetails = await Tag.findById(tag);
    if (!tagDetails) {
      return res.status(404).json({
        success: false,
        message: 'Tag Details not found',
      });
    }
    //upload image to cloudinary ,get secure url
    const thumbnailImage = await uploadImageToCloudinary(
      thumbnail,
      process.env.FOLDER_NAME
    );
    //create a new course entry in DB
    const newCourse = await Course.create({
      courseName,
      courseDescription,
      instructor: instructorDetails._id,
      whatYouWillLearn: whatYouWillLearn,
      price,
      tag: tagDetails._id,
      thumbnail: thumbnailImage.secure_url,
    });
    //add course entry in user schema of instructor
    await User.findByIdAndUpdate(
      { _id: instructorDetails._id },
      { $push: { courses: newCourse._id } },
      { new: true }
    );

    //update the tag schema
    await Tag.findByIdAndUpdate(
      { _id: tag },
      { $push: { course: newCourse._id } },
      { new: true }
    );

    //return response
    return res.status(200).json({
      success: true,
      message: 'new course created successfully',
      data: newCourse,
    });
  } catch (err) {
    console.log('error while creating a course - Course', err.message);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
//getAllCourse Handler
exports.showAllCourses = async (req, res) => {
  try {
    const courses = await Course.find(
      {},
      {
        courseName: true,
        price: true,
        thumbnail: true,
        instructor: true,
        ratingAndReviews: true,
        studentsEnrolled: true,
      }
    )
      .populate('instructor')
      .exec();
    if (!courses) {
      return res.status(404).json({
        success: false,
        message: 'no courses found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'courses fetched successfully',
      courses,
    });
  } catch (err) {
    console.log('error while fetching courses - Course', err.message);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
