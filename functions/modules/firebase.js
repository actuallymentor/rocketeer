// Dependencies
const { initializeApp } = require( 'firebase-admin/app' )
const { getFirestore, FieldValue, FieldPath } = require( 'firebase-admin/firestore' )

// Admin api
const app = initializeApp()
const db = getFirestore()

const dataFromSnap = ( snapOfDocOrDocs, withDocId=true ) => {

	// If these are multiple docs
	if( snapOfDocOrDocs.docs ) return snapOfDocOrDocs.docs.map( doc => ( { uid: doc.id, ...doc.data( ) } ) )

	// If this is a single document
	return { ...snapOfDocOrDocs.data(), ...( withDocId && { uid: snapOfDocOrDocs.id } ) }

}


module.exports = {
	app: app,
	db: db,
	FieldValue: FieldValue,
	FieldPath: FieldPath,
	dataFromSnap: dataFromSnap
}
