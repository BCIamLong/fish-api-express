class APIFeatures {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }

  filter() {
    const queryOb = { ...this.queryStr };
    const options = ["sort", "fields", "page", "limit"];
    options.map(op => delete queryOb[op]);

    let operatorsStr = JSON.stringify(queryOb);
    operatorsStr = operatorsStr.replace(
      /\b(gte|lte|gt|lt)\b/g,
      match => `$${match}`,
    );

    this.query = this.query.find(JSON.parse(operatorsStr));
    return this;
  }

  sort() {
    if (this.queryStr.sort) {
      const sortStr = this.queryStr.sort.replaceAll(",", " ");
      this.query = this.query.sort(sortStr);
    }
    if (!this.queryStr.sort) this.query = this.query.sort("-createdAt");
    return this;
  }

  select() {
    if (this.queryStr.fields) {
      const fieldsStr = this.queryStr.fields.replaceAll(",", " ");
      this.query = this.query.select(fieldsStr);
    }
    if (!this.queryStr.fields) this.query = this.query.select("-__v");
    return this;
  }

  pagination(count) {
    const page = +this.queryStr.page || 1;
    const limit = +this.queryStr.limit || 10;
    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(count / limit);
    if (page <= totalPages) this.query = this.query.skip(skip).limit(limit);
    if (!(page <= totalPages)) throw new Error("Page invalid");

    return this;
  }
}

module.exports = APIFeatures;
