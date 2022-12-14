const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const request = require('request');
const config = require('config');

const Profile = require('../../models/Profile');
const user = require('../../models/Users');

// @route   GET api/profile/me
// @desc    Get current users profile
// @access  Private
router.get('/me', auth , async (req,res) => {
    try{
        const profile = await Profile.findOne({ user: req.user.id }).populate('user',
        ['name','avatar']);
        
        if(!profile){
            return res.status(400).json({ msg: 'There is no profile for this user'});   
        }

    }catch(err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/profile/
// @desc    Create or update user profile
// @access  Private
router.post('/',[auth , [
    check('status','Status is required').not().isEmpty(),
    check('skills','Skills is required').not().isEmpty()
]],async (req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()});  
    }
    

    // Get fields
    const profileFields = {};
    profileFields.user = req.user.id;
    if (req.body.handle) profileFields.handle = req.body.handle;
    if (req.body.company) profileFields.company = req.body.company;
    if (req.body.website) profileFields.website = req.body.website;
    if (req.body.location) profileFields.location = req.body.location;
    if (req.body.bio) profileFields.bio = req.body.bio;
    if (req.body.status) profileFields.status = req.body.status;
    if (req.body.githubusername)
      profileFields.githubusername = req.body.githubusername;
    // Skills - Spilt into array
    if (typeof req.body.skills !== 'undefined') {
      profileFields.skills = req.body.skills.split(',').map(skill => skill.trim());
    }
    
    // Social
    profileFields.social = {};
    if (req.body.youtube) profileFields.social.youtube = req.body.youtube;
    if (req.body.twitter) profileFields.social.twitter = req.body.twitter;
    if (req.body.facebook) profileFields.social.facebook = req.body.facebook;
    if (req.body.linkedin) profileFields.social.linkedin = req.body.linkedin;
    if (req.body.instagram) profileFields.social.instagram = req.body.instagram;

    try{
        let profile = await Profile.findOne({ user : req.user.id })

        if(profile){
            // Update
            profile = await Profile.findOneAndUpdate(
                { user: req.user.id },
                { $set: profileFields },
                { new: true }
              ).then(profile => res.json(profile)); 
              
        }
        else{
            profile = new Profile(profileFields);
            await profile.save();
            res.json(profile); 
        }
    }catch(err){
        console.error(err.message);
        res.status(500).send('Server Error')
    }

})

// @route   GET api/profile/
// @desc    Get all profiles
// @access  Private
router.get('/',async (req,res)=>{
    try{
        const profiles = await Profile.find().populate('user',['name','avatar']);
        res.json(profiles);
    }catch(err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})

// @route   GET api/profile/user/:user_id
// @desc    Get profile by user ID
// @access  Public
router.get('/user/:user_id',async (req,res)=>{
    try{
        const profiles = await Profile.findOne({ user : req.params.user_id }).populate('user',['name','avatar']);

        if(!profiles) 
            return res.status(400).json({msg: 'Profile not found'});

        res.json(profiles);
    }catch(err){
        console.error(err.message);
        if(err.kind == 'ObjectID'){
            return res.status(400).json({msg: 'Profile not found'});
        }
        res.status(500).send('Server Error');
    }
})

// @route   DELETE api/profile/
// @desc    Delete profile,user & posts
// @access  Private
router.delete('/',async (req,res)=>{
    try{
        // Remove Profile
        await Profile.findOneAndRemove( {user: req.user.id })
        // Remove User
        await User.findOneAndRemove( {_id: req.user.id })
        res.json({ msg : 'User Removed' });
    }catch(err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})

// @route   PUT api/profile/experience
// @desc    Add profile experience
// @access  Private
router.put('/experience', [auth , [
    check('title','Title is Required').not().isEmpty(),
    check('company','Company is Required').not().isEmpty(),
    check('from','From date is required').not().isEmpty(),
]], async (req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors:errors.array() });
    }

    const {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    } = req.body;

    const newExp = {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    }

    try {
        const profile = await Profile.findOne({ user: req.user.id});

        profile.experience.unshift(newExp);
        await profile.save();
        res.json(profile);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error')
    }
})

// @route   DELETE api/profile/experience/:exp_id
// @desc    Delete experience from profile
// @access  Private

router.delete('/experience/:exp_id', auth, async (req,res)=>{
    try {
        const profile = await Profile.findOne({ user: req.user.id});

        //Get remove index
        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);
        profile.experience.splice(removeIndex, 1);

        await profile.save();

        res.json(profile);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error')
    }
})

// @route   PUT api/profile/education
// @desc    Add profile education
// @access  Private
router.put('/education', [auth , [
    check('school','School is Required').not().isEmpty(),
    check('degree','Degree is Required').not().isEmpty(),
    check('fieldofstudy','Field of study is Required').not().isEmpty(),
    check('from','From date is required').not().isEmpty(),
]], async (req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors:errors.array() });
    }

    const {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    } = req.body;

    const newEdu = {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    }

    try {
        const profile = await Profile.findOne({ user: req.user.id});

        profile.education.unshift(newEdu);
        await profile.save();
        res.json(profile);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error')
    }
})

// @route   DELETE api/profile/education/:edu_id
// @desc    Delete education from profile
// @access  Private

router.delete('/education/:edu_id', auth, async (req,res)=>{
    try {
        const profile = await Profile.findOne({ user: req.user.id});

        //Get remove index
        const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id);
        profile.education.splice(removeIndex, 1);

        await profile.save();

        res.json(profile);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error')
    }
})


// @route   GET api/profile/github/:username
// @desc    Get user repos from Github
// @access  Private
router.get('/github/:username' , (req,res)=>{
    try {
        const options = {
            uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&
            sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=
            ${config.get('githubSecret')}`,
            method: 'GET',
            headers: {'user-agent':'node.js'}
        };

        request(options, (error,response,body)=>{
            if(error) console.error(error);

            if(response.statusCode !== 200){
                return res.status(404).json({ msg: 'No Github Profile found' }); 
            }

            res.json(JSON.parse(body));
        })
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})

module.exports = router;