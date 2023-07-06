const Tag = require('../models/Category');

//create a tag
exports.createCategory = async (req, res) => {
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
    const categoryDetails = await Category.create({
      name: name,
      description: description,
    });

    console.log(categoryDetails);

    return res.status(200).json({
      success: true,
      message: 'Category created successfully',
    });
  } catch (err) {
    console.log('Error in Category Creation ');
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

//getAllTags
exports.showAllCategory = async (req, res) => {
  try {
    const allCategory = await Category.find(
      {},
      { name: true, description: true }
    );

    res.status(200).json({
      success: true,
      message: 'All categories returned successfully',
      allCategory,
    });
  } catch (err) {
    console.log('Error in fetching all category ');
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
