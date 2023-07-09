// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract FarmToken {
    string public name = "FarmToken";
    string public symbol = "FARM";
    address public owner;
    address public masterChef;
    uint8 public constant decimals = 18;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
    event Mint(address indexed to, uint256 value);

    constructor() {
        owner = msg.sender;
        masterChef = address(0);
    }

    function updateMasterChef(
        address _address
    ) external onlyOwner returns (bool) {
        masterChef = _address;
        return true;
    }

    function transfer(address _to, uint256 _value) external returns (bool) {
        require(balanceOf[msg.sender] >= _value, "Insufficient balance");
        require(_to != address(0), "Invalid recipient");

        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;

        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    function approve(address _spender, uint256 _value) external returns (bool) {
        allowance[msg.sender][_spender] = _value;

        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) external returns (bool) {
        require(balanceOf[_from] >= _value, "Insufficient balance");
        require(
            allowance[_from][msg.sender] >= _value,
            "Insufficient allowance"
        );
        require(_to != address(0), "Invalid recipient");

        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;
        allowance[_from][msg.sender] -= _value;

        emit Transfer(_from, _to, _value);
        return true;
    }

    function mint(address _to, uint256 _value) external returns (bool) {
        require(
            msg.sender == masterChef || msg.sender == owner,
            "Only masterchef or owner can do this"
        );
        require(_to != address(0), "Invalid recipient");

        balanceOf[_to] += _value;

        emit Transfer(address(0), _to, _value);
        emit Mint(_to, _value);
        return true;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can do this");
        _;
    }
}
