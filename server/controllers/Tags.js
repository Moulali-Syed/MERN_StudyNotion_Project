const Tag = require('../models/Tag');

//create a tag
exports.createTag = async (req, res) => {
  try {
    //fetch data
    const { name, description } = req.body;

    //validation
    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    //create entry in db
    const tagDetails = await Tag.create({
      name: name,
      description: description,
    });

    console.log(tagDetails);

    return res.status(200).json({
      success: true,
      message: 'Tag created successfully',
    });
  } catch (err) {
    console.log('Error in Tag Creation ');
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

//getAllTags
exports.showAllTags = async (req, res) => {
  try {
    const allTags = await Tag.find({}, { name: true, description: true });

    res.status(200).json({
      success: true,
      message: 'All tags returned successfully',
      allTags,
    });
  } catch (err) {
    console.log('Error in fetching all tags ');
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
