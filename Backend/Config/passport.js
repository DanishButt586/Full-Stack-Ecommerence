const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../Models/userModel');

// Serialize user for the session
passport.serializeUser((data, done) => {
    // Handle both existing users and new Google data
    if (data.isExisting) {
        done(null, { id: data.user._id, isExisting: true });
    } else {
        done(null, { googleData: data, isExisting: false });
    }
});

// Deserialize user from the session
passport.deserializeUser(async (data, done) => {
    try {
        if (data.isExisting) {
            const user = await User.findById(data.id);
            done(null, { user, isExisting: true });
        } else {
            done(null, { ...data.googleData, isExisting: false });
        }
    } catch (error) {
        done(error, null);
    }
});

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: '/api/auth/google/callback',
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    // Check if user already exists
                    let user = await User.findOne({ email: profile.emails[0].value });

                    if (user) {
                        // User exists - update avatar if not already set or if Google avatar is different
                        const googleAvatar = profile.photos[0]?.value || '';
                        if (googleAvatar && (!user.avatar || user.avatar !== googleAvatar)) {
                            user.avatar = googleAvatar;
                            await user.save();
                        }
                        // Return user with existing flag
                        return done(null, { user, isExisting: true });
                    }

                    // User doesn't exist, return profile data for signup completion
                    const googleData = {
                        name: profile.displayName,
                        email: profile.emails[0].value,
                        avatar: profile.photos[0]?.value || '',
                        isExisting: false,
                    };

                    done(null, googleData);
                } catch (error) {
                    done(error, null);
                }
            }
        )
    );
} else {
    console.warn('Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable Google login.');
}

module.exports = passport;
