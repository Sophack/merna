const { AuthenticationError } = require("apollo-server-express");
const { User } = require("../models");
const { signToken } = require("../utils/auth");

const resolvers = {
    Query: {
        me: async (parent, args, context) => {
            if (context.user) {
                const userData = await User.findOne({ _id: context.user._id })
                .select("-__v -password").populate('books');              
                return userData;
            };
            throw new AuthenticationError("Please Login!");
        },
    }, 

    Mutation: {
        addUser: async ( parent, args ) => {
            try {
                const user = await User.create(args);
                const token = signToken(user);
                return { token, user };                
            } catch (error) {
                console.log(error);                
            }
        },
        login: async ( parent, { email, password }) => {
            const user = await User.findOne( { email } );

            if (!user) {
                throw new AuthenticationError("Invliad Username");
            };

            const correctPW = await user.isCorrectPassword(password);
            if (!correctPW) {
                throw new AuthenticationError("Incorrect Password!");
            };

            const token = signToken(user);
            return { token, user };
        },     

        //if user logged in update users books
        saveBook: async (parent, { bookData }, context) => {
            if ( context.user ) {
                const updatedUser = await User
                    .findOneAndUpdate(
                        { _id: context.user._id }, 
                        { $addToSet: { savedBooks: bookData } },
                        { new: true, runValidators: true }
                    );
                return updatedUser;
            };
            throw new AuthenticationError("Please Login");
        },
        //if user loggedin remove book
        removeBook: async (parent, { bookId }, context) => {
            if (context.user) {
                const updatedUser = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $pull: { savedBooks: { bookId } } },
                    { new: true,  runValidators: true }
                );
                return updatedUser;
            };
            throw new AuthenticationError("Please Login!");
        },
    },
};

module.exports = resolvers;