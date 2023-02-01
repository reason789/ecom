
class ApiFeatures{
    constructor(query, queryStr){  
        // query = Product.find()
        // queryStr = samosa
        this.query = query;
        this.queryStr = queryStr
    }

    search(){
        const keyword = this.queryStr.keyword 
        ? {
            name: {
                $regex: this.queryStr.keyword,
                $options: "i",
            },
        }:{};


        this.query = this.query.find({...keyword});  // If we do not use ...keyword, it wont care anout condition. It will work like Product.find()
        return this;
    }

    filter(){
        // const queryCopy = this.queryStr
        // queryCopy got the reference not the value
        // If we change the queryCopy the value will be changed
        // this is why we use 
        const queryCopy = {...this.queryStr}  // we made a copy here
        
        // Remove some fields here
        // const removeFields = ["keyword","page","limit"];
        const removeFields = ["keyword","pages","limit"];
        
        removeFields.forEach((key) => delete queryCopy[key]);

        // from objectformat( { price: { gt: '5200', It: '2500' } } ) to json format({"price":{"gt":"5200","It":"2500"}})
        // beacuse we want to add $ sign bafore gt|gte|It|lte 
        

        let queryStr = JSON.stringify(queryCopy);
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g,(key) => `$${key}`)

        this.query = this.query.find(JSON.parse(queryStr));

        return this;
    }

    pagination(resultPerPage){
        const currentPage = Number(this.queryStr.pages) || 1;

        const skip = resultPerPage * (currentPage - 1);

        this.query = this.query.limit(resultPerPage).skip(skip);
        return this;
    }
}

module.exports = ApiFeatures