const User = require('../models/User');
const OTP = require('../models/OTP');
const otpGenerator = require('otp-generator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mailSender = require('../utils/mailSender');
const { passwordUpdated } = require('../mail/templates/passwordUpdate');
const Profile = require('../models/Profile');
require('dotenv').config();

//sendOTP
exports.sendOTP = async (req, res) => {
  try {
    //fetch email from req.body
    const { email } = req.body;

    //check if user already exist in database
    const checkUserPresent = await User.findOne({ email });

    if (checkUserPresent) {
      return res.status(401).json({
        success: false,
        message: 'user already registered',
      });
    }

    //generate OTP
    var otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    console.log('OTP Generated ', otp);
    //check the generated OTP is unique or not
    let result = await OTP.findOne({ otp: otp });

    while (result) {
      otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });
      result = await OTP.findOne({ otp: otp });

      const otpPayload = { email, otp };
      //create otp entry in database
      const otpBody = await OTP.create(otpPayload);
      console.log(otpBody);

      //return response success
      res.status(200).json({
        success: true,
        message: 'otp sent successfully',
      });
    }
  } catch (err) {
    console.log('error in sendOTP - contollers/Auth.js', err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

//signup
exports.signUp = async (req, res) => {
  try {
    //fetch data from req body
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      accountType,
      contactNumber,
      otp,
    } = req.body;
    //validate the data
    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !confirmPassword ||
      !contactNumber ||
      !otp
    ) {
      return res
        .status(403)
        .json({ success: false, message: 'All fields are mandatory' });
    }
    //match the password and confirm password

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message:
          'Password and Confirm Password value doesnot match, Please try again',
      });
    }
    //check user already exist or not
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: 'user is already registered' });
    }
    //find most recent otp stored for the user
    const recentOTP = await OTP.find({ email })
      .sort({ createdAt: -1 })
      .limit(1);
    console.log(recentOTP);
    //validate OTP
    if (recentOTP.length === 0) {
      //otp not found
      return res.status(400).json({ success: false, message: 'otp not found' });
    } else if (otp !== recentOTP[0].otp) {
      //Invalid otp
      return res.status(400).json({
        success: false,
        message: 'invalid otp',
      });
    }
    //hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    let approved = '';
    approved === 'Instructor' ? (approved = false) : (approved = true);

    //create a profile and save in db , with all null values
    const profileDetails = await Profile.create({
      gender: null,
      dateOfBirth: null,
      about: null,
      contactNumber: null,
    });
    //create entry in DB
    const user = await User.create({
      firstName,
      lastName,
      email,
      contactNumber,
      password: hashedPassword,
      accountType,
      approved: approved,
      additionalDetails: profileDetails._id,
      image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
    });

    //return response
    return res.status(200).json({
      success: true,
      message: 'user registered successfully',
      user,
    });
  } catch (err) {
    console.log('error in signUp - controllers/Auth.js', err);
    res.status(500).json({
      success: false,
      message: 'user cannot be registered . Please try again',
    });
  }
};

//login
exports.login = async (req, res) => {
  try {
    //get data from req body
    const { email, password } = req.body;

    //validate the data
    if (!email || !password) {
      res.status(403).json({
        success: false,
        message: 'all fields are required.Please try again',
      });
    }
    //check if user exists in DB
    const user = await User.findOne({ email }).populate('additionalDetails');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'user is not registered .please sign up ',
      });
    }
    //match the password then generate JWT token
    if (await bcrypt.compare(password, user.password)) {
      const payload = {
        email: user.email,
        id: user._id,
        accountType: user.accountType,
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '24h',
      });

      user.token = token;
      user.password = undefined;
      //create cookie

      const options = {
        expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        httpOnly: true,
      };
      res.cookie('token', token, options).status(200).json({
        success: true,
        token,
        user,
        message: 'Logged In Successfully',
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'password is incorrect',
      });
    }
    //send response
  } catch (err) {
    console.log('error in login - controllers/Auth.js', err);
    return res.status(500).json({
      success: false,
      message: 'Login failure,please try again',
    });
  }
};

//changePassword
exports.changePassword = async (req, res) => {
  try {
    //get data from req body
    const userDetails = await User.findById(req.user.id);

    //we get oldPassword,newPassword,confirmNewPassword
    const { oldPassword, newPassword, confirmNewPassword } = req.body;
    const user = await User.findOne({ email });
    //validate old password
    const isPasswordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordMatch) {
      // If old password does not match, return a 401 (Unauthorized) error
      return res
        .status(401)
        .json({ success: false, message: 'The password is incorrect' });
    }

    // Match new password and confirm new password
    if (newPassword !== confirmNewPassword) {
      // If new password and confirm new password do not match, return a 400 (Bad Request) error
      return res.status(400).json({
        success: false,
        message: 'The password and confirm password does not match',
      });
    }

    // Update password
    const encryptedPassword = await bcrypt.hash(newPassword, 10);
    const updatedUserDetails = await User.findByIdAndUpdate(
      req.user.id,
      { password: encryptedPassword },
      { new: true }
    );

    // Send notification email
    try {
      const emailResponse = await mailSender(
        updatedUserDetails.email,
        passwordUpdated(
          updatedUserDetails.email,
          `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
        )
      );
      console.log('Email sent successfully:', emailResponse.response);
    } catch (error) {
      // If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
      console.error('Error occurred while sending email:', error);
      return res.status(500).json({
        success: false,
        message: 'Error occurred while sending email',
        error: error.message,
      });
    }
    // Return success response
    return res
      .status(200)
      .json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    // If there's an error updating the password, log the error and return a 500 (Internal Server Error) error
    console.error('Error occurred while updating password:', err);
    return res.status(500).json({
      success: false,
      message: 'Error occurred while updating password',
      error: err.message,
    });
  }
};
