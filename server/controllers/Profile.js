const Profile = require('../models/Profile');
const User = require('../models/User');
const { uploadImageToCloudinary } = require('../utils/imageUploader');

exports.updateProfile = async (req, res) => {
  try {
    //get data
    const { dateOfBirth = '', about = '', contactNumber, gender } = req.body;
    //get loggedIn userId - we can get this from request because we have added it to request while jwt auth verification
    const userId = req.user.id;
    //validate data
    if (!contactNumber || !gender) {
      return res.status(404).json({
        success: false,
        message: 'all fields are mandatory',
      });
    }
    //find profile
    const userDetails = await User.findById(userId);
    const profileId = userDetails.additionalDetails;
    const profileDetails = await Profile.findById(profileId);
    //update profile
    profileDetails.dateOfBirth = dateOfBirth;
    profileDetails.about = about;
    profileDetails.gender = gender;
    profileDetails.contactNumber = contactNumber;
    await profileDetails.save();
    //return response
    return res.status(200).json({
      success: true,
      message: 'Profile Details updated successfully',
      profileDetails,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'error in updating profile',
    });
  }
};

//deleteAccount
exports.deleteAccount = async (req, res) => {
  try {
    //get id
    const id = req.user.id;
    //check id is valid
    const userDetails = await User.findById(id);
    if (!userDetails) {
      return res.status(404).json({
        success: false,
        message: 'user not found',
      });
    }
    //delete profile
    await Profile.findByIdAndDelete({ _id: userDetails.additionalDetails });
    //delete user
    await User.findByIdAndDelete({ _id: id });
    //Uneroll user from all enrolled courses
    //return response
    return res.status(200).json({
      success: true,
      message: 'account deletion successful',
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

//getAllUserDetails
exports.getAllUserDetails = async (req, res) => {
  try {
    //get id
    const id = req.user.id;

    //validation and get user details
    const userDetails = await User.findById(id)
      .populate('additionalDetails')
      .exec();

    //return response
    return res.status(200).json({
      success: true,
      message: 'user details fetched successfully',
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
