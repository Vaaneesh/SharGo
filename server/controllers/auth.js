import bcrypt from "bcryptjs";
import User from "../models/User.js";
import jwt from "jsonwebtoken";


export const register = async (req, res, next) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    const newUser = new User({ name, email, password: hash });
    await newUser.save();

    const accessToken = jwt.sign(
      { id: newUser._id, isAdmin: newUser.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '1d' } 
    );

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', 
      maxAge: 24 * 60 * 60 * 1000, 
      sameSite: 'strict'
    };

    const { password: _, isAdmin, ...otherDetails } = newUser._doc;

    return res.status(200)
      .cookie("accessToken", accessToken, options)
      .json({ user: { ...otherDetails }, isAdmin });

  } catch (err) {
    console.error('Error during registration:', err);
    return res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};

export const login = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(400).json({ message: "Wrong email or password" });
    }

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: "Wrong email or password" });
    }

    const accessToken = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '1d' } 
    );

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 2 * 60 * 60 * 1000, 
      sameSite: 'strict'
    };

    const { password: _, isAdmin, ...otherDetails } = user._doc;

    return res.status(200)
      .cookie("accessToken", accessToken, options)
      .json({ user: { ...otherDetails }, isAdmin });

  } catch (err) {
    console.error('Error during login:', err);
    return res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};

export const logout = async (req, res, next) => {
  try {
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0 // Immediately expire the cookie
    });
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    console.error('Error during logout:', err);
    next(err);
  }
};
