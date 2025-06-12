const tf = require('@tensorflow/tfjs-node');
console.log(tf.version);

try {
    const tf = require('@tensorflow/tfjs-node');
    console.log('TensorFlow.js Node loaded successfully!');
    const a = tf.tensor([1, 2, 3]);
    a.print();
} catch (e) {
    console.error('Error loading TensorFlow.js Node:', e);
}