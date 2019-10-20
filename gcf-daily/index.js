/* HTTP Cloud Function.
*
* @param {Object} req Cloud Function request context.
* @param {Object} res Cloud Function response context.
*/
exports.daily = (req, res) => {
    res.send('Hello from Cloud Functions and Cloud Source Repositories');
};