const { instance } = require('../config/razorpay');

const Course = require('../controllers/Course');
const User = require('../controllers/User');

const mailSender = require('../utils/mailSender');

const {
  courseEnrollmentEmail,
} = require('../mail/templates/courseEnrollmentEmail');

//capture payment and initiate the razorpay order
exports.capturePayment = async (req, res) => {
  //get courseId and userId
  const { course_id } = req.body;
  const userId = req.user.id;
  //validation
  if (!course_id) {
    return res.status(404).json({
      success: false,
      message: 'Please provide a valid course id',
    });
  }
  //check valid course details
  let course;
  try {
    course = await Course.findById(course_id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'couldnot find the course',
      });
    }
    //check if user has already registered for same course
    //converting string to objectId
    const uid = new mongoose.Types.ObjectId(userId);
    if (course.studentsEnrolled.includes(uid)) {
      res.status(400).json({
        success: false,
        message: 'Student is already enrolled',
      });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
  //create order
  const amount = course.price;
  const currency = 'INR';
  const options = {
    amount: amount * 100,
    currency: currency,
    receipt: Math.random(Date.now()).toString(),
    notes: {
      courseId: course_id,
      userId,
    },
  };

  try {
    //initiate payment using razorpay
    const paymentResponse = await instance.orders.create(options);
    console.log(paymentResponse);

    return res.status(200).json({
      success: true,
      courseName: course.courseName,
      courseDescription: course.courseDescription,
      thumbnail: course.thumbnail,
      orderId: paymentResponse.id,
      currency: paymentResponse.currency,
      amount: paymentResponse.amount,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: 'Cannot initiate order',
    });
  }
};

//verify signature of razorpay and server
exports.verifySignature = async (req, res) => {
  const webhookSecret = '123456789';
  const signature = req.headers['x-razorpay-signature'];

  const shasum = crypto.createHmac('sha256', webhookSecret);
  shasum.update(JSON.stringify(req.body));
  const digest = shasum.digest('hex');

  if (signature === digest) {
    console.log('payment is authorised');
    const { courseId, userId } = req.body.payload.payment.entity.notes;
    try {
      //fulfill the action
      //find the course and enroll the student in it
      const enrolledCourse = await Course.findOneAndUpdate(
        {
          _id: courseId,
        },
        { $push: { studentsEnrolled: userId } },
        { new: true }
      );

      if (!enrolledCourse) {
        return res.status(500).json({
          success: false,
          message: 'Course not found',
        });
      }

      //find the student and add the course in list of enrolled courses
      const enrolledStudent = await User.findOneAndUpdate(
        { _id: userId },
        { $push: { courses: courseId } },
        { new: true }
      );
      console.log(enrolledStudent);

      //send mail confirmation
      const emailResponse = await mailSender(
        enrolledStudent.email,
        'Congratulations from Learning Portal',
        'Congratulations you are onboarded into a new Course'
      );

      console.log(emailResponse);
      return res.status(200).json({
        success: true,
        message: 'Signature verified and Course Added',
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  } else {
    return res.status(400).json({
      success: false,
      message: 'Invalid request',
    });
  }
};
