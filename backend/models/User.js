import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    phone: {
      type: String,
      required: [true, 'Please add a phone number'],
      unique: true,
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'seller', 'designer', 'collaborator'],
      default: 'seller',
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'deactivated', 'suspended'],
      default: 'pending',
    },
    profilePicture: {
      type: String,
      default: '',
    },
    verificationOTP: {
      type: String,
      default: null,
    },
    verificationExpires: {
      type: Date,
      default: null,
    },
    passwordResetOTP: {
      type: String,
      default: null,
    },
    passwordResetExpires: {
      type: Date,
      default: null,
    },
    // Scoped to seller if role = collaborator
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Collaborator permissions (FR-17)
    permissions: {
      type: [String],
      default: [],
    },
    businessInfo: {
      businessName: { type: String, default: '' },
      industry: { type: String, default: '' },
      website: { type: String, default: '' },
      fbPageUrl: { type: String, default: '' },
    },
    portfolioInfo: {
      bio: { type: String, default: '' },
      skills: { type: [String], default: [] },
      hourlyRate: { type: Number, default: 0 },
      portfolioLinks: { type: [String], default: [] },
    },
    brandingScore: {
      type: Number,
      default: 0,
    },
    badges: [
      {
        name: { type: String, required: true },
        description: { type: String, default: '' },
        awardedAt: { type: Date, default: Date.now },
      },
    ],
    optInLeaderboard: {
      type: Boolean,
      default: false,
    },
    streakDays: {
      type: Number,
      default: 0,
    },
    lastPostDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', UserSchema);
export default User;
