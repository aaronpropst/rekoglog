rekogUtils = function(){

    function deetsToStats(deets){
      onlySure=(x)=>{
        return x.Confidence > 80 ? x.Value : undefined;
      }
  
      var stats = {
        AgeRange: deets.AgeRange,
        Beard: onlySure(deets.Beard),
        Mustache: onlySure(deets.Mustache),
        Eyeglasses: onlySure(deets.Eyeglasses),
        Gender: onlySure(deets.Gender),
        MouthOpen: onlySure(deets.MouthOpen),
        Smile: onlySure(deets.Smile),
        Emotion: deets.Emotions[0].Type,
        //All: deets
      }
  
      return stats;
    }
  
    return {
      deetsToStats: deetsToStats
    }
  }