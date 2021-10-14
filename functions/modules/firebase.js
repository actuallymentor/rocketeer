// Dependencies
const admin = require('firebase-admin')

// Admin api
const app = admin.initializeApp()
const db = app.firestore()
const { FieldValue, FieldPath } = admin.firestore

module.exports = {
	db: db,
	FieldValue: FieldValue,
	FieldPath: FieldPath
}
