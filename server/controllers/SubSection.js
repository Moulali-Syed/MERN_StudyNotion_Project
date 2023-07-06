const SubSection = require('../models/SubSection');
const Section = require('../models/Section');
const { uploadImageToCloudinary } = require('../utils/imageUploader');

//createSubSection
exports.createSubSection = async (req, res) => {
  try {
    //fetch data from req body
    const { sectionId, title, timeDuration, description } = req.body;
    //extract file/video
    const video = req.files.videoFile;
    //validation
    if (!sectionId || !title || !timeDuration || !description) {
      return res.status(400).json({
        success: false,
        message: 'All fields are mandatory',
      });
    }
    //upload video to cloudinary , get the secure url
    const uploadDetails = await uploadImageToCloudinary(
      video,
      process.env.FOLDER_NAME
    );
    //create sub section
    const subSectionDetails = await SubSection.create({
      title: title,
      timeDuration: timeDuration,
      description: description,
      videoUrl: uploadDetails.secure_url,
    });
    //update the subsection id to section
    const updatedSection = await Section.findByIdAndUpdate(
      { _id: sectionId },
      {
        $push: {
          subSection: subSectionDetails._id,
        },
      },
      { new: true }
    )
      .populate('subSection')
      .exec();
    //use populate
    //return response
    return res.status(200).json({
      success: true,
      message: 'Sub Section created successfully',
    });
  } catch (err) {
    console.log('error in creating subsection', err.message);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

//update subsection
exports.updateSubSection = async (req, res) => {
  try {
    //fetch data
    const { subSectionId, title, timeDuration, description } = req.body;
    //validate data
    if (!subSectionId || !title || !timeDuration || !description) {
      return res.status(404).json({
        success: false,
        message: 'subsection reference is missing',
      });
    }
    //update data
    const updatedSubSection = await SubSection.findByIdAndUpdate(
      { _id: subSectionId },
      { title, timeDuration, description },
      { new: true }
    );

    //return response
    return res.status(200).json({
      success: true,
      message: 'sub section details updated successfully',
    });
  } catch (err) {
    console.log('error while updating sub section ', err.message);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
//delete subsection
exports.deleteSubSection = async (req, res) => {
  try {
    //get data
    const { subSectionId } = req.params;
    //findByIdAndDelete
    await SubSection.findByIdAndUpdate(subSectionId);
    //do we need to delete subsection id from section schema check while testing
    return res.status(200).json({
      success: true,
      message: 'subsection deleted successfully',
    });
  } catch (err) {
    console.log('error in deleting subsection ', err.message);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
