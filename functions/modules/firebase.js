// Dependencies
const { initializeApp } = require( 'firebase-admin/app' )
const { getFirestore, FieldValue, FieldPath } = require( 'firebase-admin/firestore' )

// Admin api
const app = initializeApp()
const db = getFirestore()

module.exports = {
	app: app,
	db: db,
	FieldValue: FieldValue,
	FieldPath: FieldPath
}
