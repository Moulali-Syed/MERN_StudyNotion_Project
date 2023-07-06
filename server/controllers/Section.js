const Section = require('../models/Section');
const Course = require('../models/Course');

exports.createSection = async (req, res) => {
  try {
    //data fetch
    const { sectionName, courseId } = req.body;
    //data validation
    if (!sectionName || !courseId) {
      return res.status(400).json({
        success: false,
        message: 'All fields are mandatory',
      });
    }
    //create section
    const newSection = await Section.create({ sectionName });
    //update course with section object id
    const updatedCourseDetails = await Course.findByIdAndUpdate(
      { _id: courseId },
      {
        $push: {
          courseContent: newSection._id,
        },
      },
      { new: true }
    ).populate('course');
    //use populate to replace sections/sub sections both in updatedCourseDetails
    //return response
    return res.status(200).json({
      success: true,
      message: 'Section created successfully',
      updatedCourseDetails,
    });
  } catch (err) {
    console.log('error in Section creation controller', err.message);
    return res.status(500).json({
      success: false,
      message: 'Unable to create setion ,please try again',
      error: err.message,
    });
  }
};

exports.updateSection = async (req, res) => {
  try {
    //data input
    const { sectionName, sectionId } = req.body;
    //data validation
    if (!sectionName || !sectionId) {
      return res.status(400).json({
        success: false,
        message: 'All fields are mandatory',
      });
    }
    //update data
    const section = await Section.findByIdAndUpdate(
      sectionId,
      { sectionName },
      { new: true }
    );
    //return response

    return res.status(200).json({
      success: true,
      message: 'section updated successfully',
    });
  } catch (err) {
    console.log('error in Section update controller', err.message);
    return res.status(500).json({
      success: false,
      message: 'Unable to update setion ,please try again',
      error: err.message,
    });
  }
};

exports.deleteSection = async (req, res) => {
  try {
    //getsectionId
    const { sectionId } = req.params;
    //findByIdAndDelete
    await Section.findByIdAndDelete(sectionId);
    //do we need to delete the section id from the course schema(check while testing)
    //return response
    return res.status(200).json({
      success: true,
      message: 'Section Deleted Successfully',
    });
  } catch (err) {
    console.log('error in Section delete controller', err.message);
    return res.status(500).json({
      success: false,
      message: 'Unable to delete setion ,please try again',
      error: err.message,
    });
  }
};
