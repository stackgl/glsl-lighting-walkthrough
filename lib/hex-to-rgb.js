import hex from 'hex-rgb'
export default (str) => hex(str).map(x => x/255)
