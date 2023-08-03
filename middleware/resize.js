import Jimp from "jimp";

export default async function resize(req, res, next) {
    const { path} = req.file;
    await Jimp.read(path)
      .then(avatar => avatar.resize(250, 250).write(path))
      .catch(err => console.error(err));
    next()
}