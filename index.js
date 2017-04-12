(function(angular) {
    'use strict';

    angular.module('homeworkApp', [])

    .controller('calcController', function ($scope) {
        var that = this;
        this.output = '';
        this.formatError = false;
        $scope.inlineFunc = null;

        this.showResult = function () {
            alert(`The answer to your function is: ${this.output}`);
        };

        this.clear = function () {
            this.output = null;
            $scope.inlineFunc = null;
        };

        // This validation is purely to help the user from providing the wrong format.
        // A message that contains a more specific message based on the user's error 
        // that comes from the directive would make sense
        $scope.$watch('inlineFunc', function (newVal) {
            if ($scope.inlineFunc && $scope.inlineFunc.length >= 4) {
                let pattern = new RegExp(/^((\d+)(\s?)([\+\-\*\/])(\s?)(\d+))?((\s?)([\+|\-|\*|\/]?)(\s?)(\d+?))+?$/, 'g');
                that.formatError = pattern.test(newVal) ? false : true;
                that.formatSuccess = !that.formatError;
            }
        });

    })
    .directive('inlineInputCalculator', ['rdnCalculator', function (rdnCalculator) {
        return {
            restrict: 'AE',
            require: '^ngModel',
            scope: {
                error: "=",
                answer: "="
            },
            transclude: true,
            replace: true,
            template: `<input type="text" class="form-control" />`,
            link: function ($scope, $elem, $attrs, ngModel) {
                const error = $scope.error;

                function convertToRDN (inlineInput) {
                    let stackOfOperators = [];
                    let output = "";
                    let operatorString = "*/+-";
                    let operators = {
                        "*": {
                            precedence: 2
                        },
                        "/": {
                            precedence: 2
                        },
                        "+": {
                            precedence: 1
                        },
                        "-": {
                            precedence: 1
                        }
                    };

                    inlineInput = inlineInput.split(/([\+\-\*\/\^\(\)])/);
                    inlineInput.forEach(function (val, idx, arr) {
                        if (val === "") {
                            arr.splice(idx, 1)
                        }
                    });
                    inlineInput.forEach(function (val, idx) {
                        // val is now only either number or operator
                        if (!isNaN(val)) {
                            output += val + " ";
                        } else if (operatorString.indexOf(val) !== -1) {
                            let value = val;
                            let lastOperator = stackOfOperators[stackOfOperators.length - 1];

                            while (operatorString.indexOf(lastOperator) !== -1 && (operators[value].precedence <= operators[lastOperator].precedence)) {
                                output += stackOfOperators.pop() + " ";
                                lastOperator = stackOfOperators[stackOfOperators.length - 1];
                            }
                            stackOfOperators.push(value);
                        }
                    });
                    while (stackOfOperators.length > 0) {
                        output += stackOfOperators.pop() + " ";
                    }
                    return output;
                }

                function parseInput (inlineInputFromView) {
                    let rdn = "";
                    let answer = null;
                    // recommended backup validation on input to be sure it's in the right format
                    // and to improve encapsulation
                    if (!error) {
                        rdn = inlineInputFromView.replace(/\s+/g, "");
                        rdn = convertToRDN(rdn);
                        answer = rdnCalculator.eval(rdn);
                    }

                    $scope.answer = answer;
                    return inlineInputFromView;
                }

                function formatInput (val) {
                    let userFriendlyNull = undefined;
                    userFriendlyNull = val === null ? "" : val;
                    return userFriendlyNull;
                }

                ngModel.$formatters.push(formatInput);
                ngModel.$parsers.push(parseInput);

            }
        };
    }])
    .factory('rdnCalculator', function () {
        return {
            eval: function (rdnInput) {
                let rdnResult = [];
                rdnInput = rdnInput.split(" ");
                rdnInput.forEach(function (val) {
                    if(!isNaN(val)) {
                        rdnResult.push(val);
                    } else {
                        var secondNum = rdnResult.pop();
                        var firstNum = rdnResult.pop();
                        if (val === "*") { //whole numbers 
                            rdnResult.push(parseInt(secondNum) * parseInt(firstNum));
                        } else if (val === "/") {
                            rdnResult.push(parseInt(firstNum) / parseInt(secondNum));
                        } else if (val === "+") {
                            rdnResult.push(parseInt(secondNum) + parseInt(firstNum));
                        } else if (val === "-") {
                            rdnResult.push(parseInt(firstNum) - parseInt(secondNum));
                        }
                    }
                });

                return rdnResult[0];
            }
        };
    });
})(window.angular);