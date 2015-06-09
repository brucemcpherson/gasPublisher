/** @description
 * simple timer for GAS profiling
 * See http://ramblings.mcpher.com/Home/excelquirks/codeuse for more details
 * @author <a href="mailto:bruce@mcpher.com">Bruce McPherson</a><a href="http://ramblings.mcpher.com"> ramblings.mcpher.com</a>
 */
 
/**
 * @static
 */
var timerList;
/**
 * Creates the timerCollection if not already known and returns a new timer item
 * @param {string} s Identifies a timer item
 * @param {string=} textOptional some additional description to add to reports about the timer item
 * @return {timerItem} a new timer item
 */
function useTimer(s,textOptional) {
  if (!timerList) { 
    timerList = new timerCollection ();
    timerList.xTimerList = timerList;
  }
  return isUndefined(s) ? timerList : timerList.timerThing(s,textOptional);
}
/**
 * the timerCollection
 * @class
 * @return {timerCollection} a new timer collection
 */
function timerCollection ()  {
  this.xCollection = new collection(0);
  this.xMaster = new timerItem(EGAHACKS.EGAHACKSTimer,"Master Timer");
  this.xMaster.start();
  return this;
};

/**
 * finds the timer item with the given key or creates it and adds to the collection
 * @param {string} s Identifies a timer item
 * @param {string=} textOptional some additional description to add to reports about the timer item
 * @return {timerItem} the timer item assoacited with the given key
 */
timerCollection.prototype.timerThing = function (s,textOptional) {
  var id = this.exists(s,false);
  if (!id) { 
    id = this.xTimerList.xCollection.add (new timerItem(s,textOptional),s);
  }
  return id;
};

/**
 * finds the timer item with the given key 
 * @param {string} s Identifies a timer item
 * @param {boolean=} complain whether to deliver a message if timerItem not found
 * @return {timerItem} the timer item assoacited with the given key
 */
timerCollection.prototype.exists = function(s,complain) {
  return this.xTimerList.xCollection.item(s,complain);
};

/**
 * enumerate a the collection in the timerCollection
 * @this {timerCollection} 
 * @param {function(timerItem)} a function that will be called for each item
 * @return {timerCollection} the timer collection
 */
timerCollection.prototype.forEach = function (yourfunction) {
  for (var i =0 ; i < this.xCollection.count() ;i++) {
    yourfunction(this.xCollection.item(i));
  }
  return this;
};

/**
 * reports the statistics for each item in the timer collection 
 * @param {boolean =} optShowMaster whether to report on the overall time from the first call to the timerCollection(default yes)
 * @return {string} the report on all timer items
 */
timerCollection.prototype.report = function (optShowMaster) {
  this.xMaster.stop();
  var s = fixOptional (optShowMaster, true) ? this.xMaster.report() : '';
  this.forEach( function (item) {
      if (s) s+= "\n";
      s +=  item.report() ;
    }
  );
  return s;
};
/**
 * the timerItem
 * @class
 * @return {timerItem} a new timer item
 */
function timerItem(s,t) {
  this.xText = fixOptional(t,s);
  this.xKey = s;
  this.clear();
  return this;
};
/**
 * reports the statistics for a single timer item
 * @return {string} the report on this timer item
 */
timerItem.prototype.report = function() {
  return this.xKey + ' : elapsed '  + this.elapsed()  + ' : iterations ' + 
          this.iterations() +  ' : ' + this.xText + ' : '

};
/**
 * Starts a single timer item
 * @param {string} t any text to report against this timer item
 * @return {timerItem} the timer Item
 */
timerItem.prototype.start = function (t) {
  if (!isUndefined(t)) this.xText = t;
  this.xFinish = this.xStart = new Date();
  return this;
};

/**
 * stops a single timer item and increments the number of iterations
 * @return {timerItem} the timer Item
 */
timerItem.prototype.stop = function () {
  this.pause();
  this.xIterations ++;
  return this;
};

/**
 * pauses a single timer item but does not increment the number of iterations
 * @return {timerItem} the timer Item
 */
timerItem.prototype.pause = function () {
  this.xFinish = new Date();
  this.xElapsed += this.duration();
  return this;
};

/**
 * how long a timerItem lasted
 * @return {number} the duration
 */
timerItem.prototype.duration = function() {
  return this.xFinish - this.xStart ;
};

/**
 * clear resets a timerItems statistics
 * @return {timerItem} the timer Item
 */
timerItem.prototype.clear = function() {
  this.xIterations = this.xElapsed = 0 ;
  return this;
};
/**
 * how long since the timer started till now
 * @return {number} how long since the timer started
 */
timerItem.prototype.soFar = function() {
  return new Date() - this.xStart ;
};
/**
 * the total elapsed time for all iterations of this timer
 * @return {number} the total elaspsed time this timer was active
 */
timerItem.prototype.elapsed = function() {
  return this.xElapsed;
};
/**
 * the total number of iterations of this timer
 * @return {number} the total number of iterations of this timer
 */
timerItem.prototype.iterations = function() {
  return this.xIterations;
};
